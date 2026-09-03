import { beforeEach, describe, expect, it } from "vitest";
import type { RaffleCampaign } from "../../domain/raffle/campaign";
import { Participant } from "../../domain/raffle/entities/participant";
import type { RaffleStore } from "../../domain/raffle/store-directory";
import { PhoneNumber } from "../../domain/raffle/value-objects/phone-number";
import { FixedClock, InMemoryParticipantRepository } from "../../testing";
import { DrawWinner } from "./draw-winner";

const CENTRO: RaffleStore = {
	id: "pi-teresina-centro",
	name: "Loja Centro",
	city: "Teresina",
	state: "Piauí",
	pool: "unidades",
};

const CAMPAIGN: RaffleCampaign = {
	id: "kit-churrasco-2026",
	entriesCloseAt: new Date("2026-08-30T23:59:59-03:00"),
};

const DURING_CAMPAIGN = new Date("2026-08-10T12:00:00-03:00");
const DRAW_DAY = new Date("2026-08-31T15:00:00-03:00");

let participants: InMemoryParticipantRepository;
let clock: FixedClock;
let useCase: DrawWinner;

async function addParticipant(
	rawPhone: string,
	options: { name?: string; at?: Date; times?: number } = {},
): Promise<void> {
	const phone = PhoneNumber.create(rawPhone);

	if (!phone.ok) {
		throw new Error(`telefone inválido no teste: ${rawPhone}`);
	}

	const created = Participant.create({
		campaignId: CAMPAIGN.id,
		name: options.name ?? `Participante ${rawPhone.slice(-4)}`,
		phone: phone.value,
		store: CENTRO,
		now: options.at ?? DURING_CAMPAIGN,
	});

	if (!created.ok) {
		throw new Error("participante inválido no teste");
	}

	const participant = await participants.create(created.value);

	for (let time = 1; time < (options.times ?? 1); time += 1) {
		participant.registerAgain(options.at ?? DURING_CAMPAIGN);
		await participants.update(participant);
	}
}

beforeEach(() => {
	participants = new InMemoryParticipantRepository();
	clock = new FixedClock(DRAW_DAY);
	useCase = new DrawWinner(participants, CAMPAIGN, clock);
});

describe("DrawWinner", () => {
	// Quem decide a hora de apurar é quem conduz o sorteio (decisão do cliente);
	// a tela avisa que o prazo ainda corre, mas não bloqueia.
	it("apura mesmo com as inscrições abertas", async () => {
		clock.travelTo(DURING_CAMPAIGN);
		await addParticipant("86988970955");

		const result = await useCase.execute({
			pool: "unidades",
			seed: "loteria-5987",
		});

		expect(result.ok).toBe(true);
	});

	it("permite simular com as inscrições abertas", async () => {
		clock.travelTo(DURING_CAMPAIGN);
		await addParticipant("86988970955");

		const result = await useCase.execute({
			pool: "unidades",
			seed: "ensaio",
			mode: "simulation",
		});

		expect(result.ok).toBe(true);
	});

	it("recusa apurar sem semente", async () => {
		await addParticipant("86988970955");

		const result = await useCase.execute({ pool: "unidades", seed: "   " });

		expect(result.ok).toBe(false);

		if (!result.ok) {
			expect(result.error.code).toBe("MISSING_SEED");
		}
	});

	it("recusa apurar sem ninguém elegível", async () => {
		const result = await useCase.execute({
			pool: "unidades",
			seed: "loteria-5987",
		});

		expect(result.ok).toBe(false);

		if (!result.ok) {
			expect(result.error.code).toBe("EMPTY_DRAW");
		}
	});

	it("devolve ganhador, suplentes e ata", async () => {
		await addParticipant("86988970955");
		await addParticipant("86988970956");
		await addParticipant("86988970957");

		const result = await useCase.execute({
			pool: "unidades",
			seed: "loteria-5987",
			substitutes: 2,
		});

		expect(result.ok).toBe(true);

		if (result.ok) {
			expect(result.value.runnersUp).toHaveLength(2);
			expect(result.value.record.ganhador.whatsappE164).toBe(
				result.value.winner.phone,
			);
			expect(result.value.record.totais.elegiveis).toBe(3);
			expect(result.value.record.apuradoEm).toBe(DRAW_DAY.toISOString());
		}
	});

	it("repete o mesmo ganhador para a mesma semente", async () => {
		await addParticipant("86988970955");
		await addParticipant("86988970956");
		await addParticipant("86988970957");

		const first = await useCase.execute({
			pool: "unidades",
			seed: "loteria-5987",
		});
		const second = await useCase.execute({
			pool: "unidades",
			seed: "loteria-5987",
		});

		expect(first.ok && second.ok).toBe(true);

		if (first.ok && second.ok) {
			expect(first.value.winner.phone).toBe(second.value.winner.phone);
		}
	});

	it("tira da apuração quem foi desclassificado", async () => {
		await addParticipant("86988970955", { name: "Cadastro de teste" });
		await addParticipant("86988970956");

		const result = await useCase.execute({
			pool: "unidades",
			seed: "loteria-5987",
			excludedPhones: "(86) 98897-0955",
		});

		expect(result.ok).toBe(true);

		if (result.ok) {
			expect(result.value.winner.phone).toBe("5586988970956");
			expect(result.value.record.totais.desclassificados).toBe(1);
			expect(result.value.record.desclassificados[0]?.nome).toBe(
				"Cadastro de teste",
			);
		}
	});

	it("não conta cadastro feito depois do prazo", async () => {
		await addParticipant("86988970955");
		await addParticipant("86988970956", {
			at: new Date("2026-08-31T10:00:00-03:00"),
		});

		const result = await useCase.execute({
			pool: "unidades",
			seed: "loteria-5987",
		});

		expect(result.ok).toBe(true);

		if (result.ok) {
			expect(result.value.record.totais.elegiveis).toBe(1);
			expect(result.value.record.totais.foraDoPrazo).toBe(1);
		}
	});

	it("dá um bilhete por pessoa no critério simples e um por cadastro no ponderado", async () => {
		await addParticipant("86988970955", { times: 4 });
		await addParticipant("86988970956");

		const simple = await useCase.execute({
			pool: "unidades",
			seed: "x",
			criterion: "simples",
		});
		const weighted = await useCase.execute({
			pool: "unidades",
			seed: "x",
			criterion: "ponderado",
		});

		expect(simple.ok && weighted.ok).toBe(true);

		if (simple.ok && weighted.ok) {
			expect(simple.value.record.totais.bilhetes).toBe(2);
			expect(weighted.value.record.totais.bilhetes).toBe(5);
		}
	});
});
