import { beforeEach, describe, expect, it } from "vitest";
import type { RaffleCampaign } from "../../domain/raffle/campaign";
import { Participant } from "../../domain/raffle/entities/participant";
import type { RaffleStore } from "../../domain/raffle/store-directory";
import { PhoneNumber } from "../../domain/raffle/value-objects/phone-number";
import {
	FixedClock,
	InMemoryParticipantRepository,
	InMemoryStoreDirectory,
} from "../../testing";
import {
	RegisterParticipation,
	type RegisterParticipationInput,
} from "./register-participation";

const CENTRO: RaffleStore = {
	id: "pi-teresina-centro",
	name: "Loja Centro",
	city: "Teresina",
	state: "Piauí",
};

const TIMON: RaffleStore = {
	id: "ma-timon-ceasa",
	name: "Loja Ceasa",
	city: "Timon",
	state: "Maranhão",
};

const CAMPAIGN: RaffleCampaign = {
	id: "kit-churrasco-2026",
	entriesCloseAt: new Date("2026-08-30T23:59:59-03:00"),
};

const DURING_CAMPAIGN = new Date("2026-08-10T12:00:00-03:00");

const VALID_INPUT: RegisterParticipationInput = {
	name: "Maria da Silva",
	phone: "(86) 98897-0955",
	storeId: CENTRO.id,
};

let participants: InMemoryParticipantRepository;
let clock: FixedClock;
let useCase: RegisterParticipation;

beforeEach(() => {
	participants = new InMemoryParticipantRepository();
	clock = new FixedClock(DURING_CAMPAIGN);
	useCase = new RegisterParticipation(
		participants,
		new InMemoryStoreDirectory([CENTRO, TIMON]),
		clock,
		CAMPAIGN,
	);
});

describe("cadastro novo", () => {
	it("registra o participante e conta a primeira participação", async () => {
		const result = await useCase.execute(VALID_INPUT);

		expect(result.ok).toBe(true);

		if (result.ok) {
			expect(result.value.isNewParticipant).toBe(true);
			expect(result.value.participationCount).toBe(1);
		}

		expect(participants.size).toBe(1);
	});

	it("guarda o snapshot da loja, não apenas o id", async () => {
		await useCase.execute({ ...VALID_INPUT, storeId: TIMON.id });

		const stored = await participants.findByPhone(CAMPAIGN.id, "5586988970955");

		expect(stored?.toSnapshot()).toMatchObject({
			storeId: "ma-timon-ceasa",
			storeName: "Loja Ceasa",
			city: "Timon",
			state: "Maranhão",
		});
	});

	it("normaliza o nome, removendo espaços redundantes", async () => {
		await useCase.execute({ ...VALID_INPUT, name: "  Maria   da  Silva " });

		const stored = await participants.findByPhone(CAMPAIGN.id, "5586988970955");

		expect(stored?.name).toBe("Maria da Silva");
	});
});

describe("cadastro repetido", () => {
	it("não duplica o participante e incrementa o contador", async () => {
		// O mesmo número, nas três formas que uma pessoa costuma digitar.
		const formats = ["86988970955", "(86) 98897-0955", "+55 86 98897-0955"];

		for (const phone of formats) {
			const result = await useCase.execute({ ...VALID_INPUT, phone });

			expect(result.ok).toBe(true);
		}

		expect(participants.size).toBe(1);

		const stored = await participants.findByPhone(CAMPAIGN.id, "5586988970955");

		expect(stored?.participationCount).toBe(3);
	});

	it("sinaliza que não é participante novo, mas segue com sucesso", async () => {
		await useCase.execute(VALID_INPUT);

		const result = await useCase.execute(VALID_INPUT);

		expect(result.ok).toBe(true);

		if (result.ok) {
			expect(result.value.isNewParticipant).toBe(false);
			expect(result.value.participationCount).toBe(2);
		}
	});

	it("preserva a loja do primeiro cadastro", async () => {
		await useCase.execute(VALID_INPUT);
		await useCase.execute({ ...VALID_INPUT, storeId: TIMON.id });

		const stored = await participants.findByPhone(CAMPAIGN.id, "5586988970955");

		expect(stored?.store.id).toBe(CENTRO.id);
	});
});

describe("submissões simultâneas", () => {
	it("trata a violação do índice único como participação repetida", async () => {
		// Simula outra requisição gravando o mesmo telefone entre o `findByPhone`
		// e o `create` — é a corrida que o índice único do banco barra.
		participants.onBeforeCreate = async () => {
			participants.onBeforeCreate = null;

			const phone = PhoneNumber.create(VALID_INPUT.phone);

			if (!phone.ok) {
				throw new Error("telefone de teste inválido");
			}

			const concurrent = Participant.create({
				campaignId: CAMPAIGN.id,
				name: VALID_INPUT.name,
				phone: phone.value,
				store: CENTRO,
				now: DURING_CAMPAIGN,
			});

			if (concurrent.ok) {
				await participants.create(concurrent.value);
			}
		};

		const result = await useCase.execute(VALID_INPUT);

		expect(result.ok).toBe(true);

		if (result.ok) {
			expect(result.value.isNewParticipant).toBe(false);
			expect(result.value.participationCount).toBe(2);
		}

		expect(participants.size).toBe(1);
	});
});

describe("recusas", () => {
	it("recusa quando as inscrições já encerraram", async () => {
		clock.travelTo(new Date("2026-09-01T09:00:00-03:00"));

		const result = await useCase.execute(VALID_INPUT);

		expect(result.ok).toBe(false);

		if (!result.ok) {
			expect(result.error.code).toBe("CAMPAIGN_CLOSED");
		}

		expect(participants.size).toBe(0);
	});

	it("recusa telefone inválido", async () => {
		const result = await useCase.execute({ ...VALID_INPUT, phone: "99999" });

		expect(result.ok).toBe(false);

		if (!result.ok) {
			expect(result.error.code).toBe("INVALID_PHONE");
		}
	});

	it("recusa loja inexistente", async () => {
		const result = await useCase.execute({
			...VALID_INPUT,
			storeId: "loja-forjada",
		});

		expect(result.ok).toBe(false);

		if (!result.ok) {
			expect(result.error.code).toBe("UNKNOWN_STORE");
		}

		expect(participants.size).toBe(0);
	});

	it("recusa nome curto demais", async () => {
		const result = await useCase.execute({ ...VALID_INPUT, name: "Jo" });

		expect(result.ok).toBe(false);

		if (!result.ok) {
			expect(result.error.code).toBe("INVALID_PARTICIPANT");
		}
	});
});
