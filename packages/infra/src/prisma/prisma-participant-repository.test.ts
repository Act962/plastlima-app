import {
	DuplicateParticipantError,
	Participant,
	PhoneNumber,
	type RaffleCampaign,
	type RaffleStore,
	RegisterParticipation,
	TaxDocument,
} from "@plastlima-app/core";
import { InMemoryStoreDirectory } from "@plastlima-app/core/testing";
import { afterAll, beforeEach, describe, expect, inject, it } from "vitest";
import { SystemClock } from "../clock/system-clock";
import { createPrismaClient } from "./client";
import { PrismaParticipantRepository } from "./prisma-participant-repository";

const CENTRO: RaffleStore = {
	id: "pi-teresina-centro",
	name: "Loja Centro",
	city: "Teresina",
	state: "Piauí",
	pool: "unidades",
};

const DISTRIBUICAO: RaffleStore = {
	id: "centro-distribuicao",
	name: "Centro de Distribuição",
	city: "Teresina",
	state: "Piauí",
	pool: "cd",
};

const CAMPAIGN: RaffleCampaign = {
	id: "kit-churrasco-2026",
	entriesCloseAt: new Date("2099-12-31T00:00:00Z"),
};

const prisma = createPrismaClient(inject("databaseUrl"));
const repository = new PrismaParticipantRepository(prisma);

function buildParticipant(
	phone: string,
	name = "Maria da Silva",
	store: RaffleStore = CENTRO,
): Participant {
	const parsed = PhoneNumber.create(phone);

	if (!parsed.ok) {
		throw new Error(`telefone de teste inválido: ${phone}`);
	}

	const participant = Participant.create({
		campaignId: CAMPAIGN.id,
		name,
		phone: parsed.value,
		store,
		now: new Date("2026-08-10T12:00:00Z"),
	});

	if (!participant.ok) {
		throw new Error("participante de teste inválido");
	}

	return participant.value;
}

beforeEach(async () => {
	await prisma.participant.deleteMany({});
});

afterAll(async () => {
	await prisma.$disconnect();
});

describe("índice único", () => {
	it("barra um segundo registro com o mesmo telefone na campanha", async () => {
		await repository.create(buildParticipant("86988970955"));

		await expect(
			repository.create(buildParticipant("86988970955")),
		).rejects.toBeInstanceOf(DuplicateParticipantError);

		expect(await prisma.participant.count()).toBe(1);
	});

	it("permite o mesmo telefone em campanhas diferentes", async () => {
		await repository.create(buildParticipant("86988970955"));

		const other = Participant.restore({
			...buildParticipant("86988970955").toSnapshot(),
			campaignId: "outra-campanha",
		});

		await expect(repository.create(other)).resolves.toBeDefined();
		expect(await prisma.participant.count()).toBe(2);
	});
});

describe("mapper", () => {
	it("preserva o snapshot da loja na ida e na volta", async () => {
		const created = await repository.create(buildParticipant("86988970955"));

		expect(created.id).not.toBeNull();

		const found = await repository.findByPhone(CAMPAIGN.id, "5586988970955");

		expect(found?.toSnapshot()).toMatchObject({
			storeId: "pi-teresina-centro",
			storeName: "Loja Centro",
			city: "Teresina",
			state: "Piauí",
			phone: "5586988970955",
			phoneDisplay: "(86) 98897-0955",
			participationCount: 1,
		});
	});

	it("devolve null quando o telefone não existe", async () => {
		expect(
			await repository.findByPhone(CAMPAIGN.id, "5511999999999"),
		).toBeNull();
	});
});

describe("update", () => {
	it("persiste o incremento do contador", async () => {
		const created = await repository.create(buildParticipant("86988970955"));

		created.registerAgain(new Date("2026-08-11T09:00:00Z"));

		const updated = await repository.update(created);

		expect(updated.participationCount).toBe(2);

		const reloaded = await repository.findByPhone(CAMPAIGN.id, "5586988970955");

		expect(reloaded?.participationCount).toBe(2);
	});
});

describe("list", () => {
	beforeEach(async () => {
		await repository.create(buildParticipant("86988970955", "Maria da Silva"));
		await repository.create(buildParticipant("11987654321", "João Pereira"));
		await repository.create(buildParticipant("85999887766", "Ana Souza"));
	});

	it("lista todos da campanha", async () => {
		const result = await repository.list({ campaignId: CAMPAIGN.id });

		expect(result.total).toBe(3);
		expect(result.items).toHaveLength(3);
	});

	it("busca por nome, ignorando maiúsculas", async () => {
		const result = await repository.list({
			campaignId: CAMPAIGN.id,
			search: "maria",
		});

		expect(result.total).toBe(1);
		expect(result.items[0]?.name).toBe("Maria da Silva");
	});

	it("busca por telefone mesmo formatado", async () => {
		const result = await repository.list({
			campaignId: CAMPAIGN.id,
			search: "(11) 98765-4321",
		});

		expect(result.total).toBe(1);
		expect(result.items[0]?.name).toBe("João Pereira");
	});

	it("pagina", async () => {
		const result = await repository.list({
			campaignId: CAMPAIGN.id,
			page: 2,
			pageSize: 2,
		});

		expect(result.total).toBe(3);
		expect(result.items).toHaveLength(1);
	});
});

describe("RegisterParticipation contra o banco real", () => {
	it("deduplica o mesmo número em formatos diferentes", async () => {
		const useCase = new RegisterParticipation(
			repository,
			new InMemoryStoreDirectory([CENTRO]),
			new SystemClock(),
			CAMPAIGN,
		);

		for (const phone of [
			"86988970955",
			"(86) 98897-0955",
			"+55 86 98897-0955",
		]) {
			const result = await useCase.execute({
				name: "Maria da Silva",
				phone,
				storeId: CENTRO.id,
			});

			expect(result.ok).toBe(true);
		}

		expect(await prisma.participant.count()).toBe(1);

		const stored = await repository.findByPhone(CAMPAIGN.id, "5586988970955");

		expect(stored?.participationCount).toBe(3);
	});
});

/**
 * O grupo é o que separa os dois prêmios da campanha, e o filtro dele vive numa
 * consulta com `OR` aninhado — exatamente o tipo de coisa que só o banco de
 * verdade prova. O caso do `pool: null` é o mais importante: são os inscritos da
 * campanha anterior, gravados antes de o campo existir, e errar isso os faria
 * sumir da apuração sem nenhum erro aparecer.
 */
describe("filtro por grupo", () => {
	async function seedBothPools(): Promise<void> {
		await repository.create(
			buildParticipant("(86) 98897-0955", "Maria das Lojas"),
		);
		await repository.create(
			buildParticipant("(86) 99999-8888", "Carlos do CD", DISTRIBUICAO),
		);
	}

	/** Cadastro no formato anterior ao campo `pool`. */
	async function seedLegacyRow(): Promise<void> {
		await prisma.participant.create({
			data: {
				campaignId: CAMPAIGN.id,
				name: "Antiga Sem Grupo",
				phone: "5586977776666",
				phoneDisplay: "(86) 97777-6666",
				storeId: CENTRO.id,
				storeName: CENTRO.name,
				city: CENTRO.city,
				state: CENTRO.state,
				pool: null,
				acceptedTermsAt: new Date("2026-08-01T12:00:00Z"),
				createdAt: new Date("2026-08-01T12:00:00Z"),
				lastParticipatedAt: new Date("2026-08-01T12:00:00Z"),
			},
		});
	}

	it("lista só os participantes do grupo pedido", async () => {
		await seedBothPools();

		const cd = await repository.list({ campaignId: CAMPAIGN.id, pool: "cd" });
		const lojas = await repository.list({
			campaignId: CAMPAIGN.id,
			pool: "unidades",
		});

		expect(cd.total).toBe(1);
		expect(cd.items[0]?.name).toBe("Carlos do CD");
		expect(lojas.total).toBe(1);
		expect(lojas.items[0]?.name).toBe("Maria das Lojas");
	});

	it("traz os dois grupos quando nenhum é pedido", async () => {
		await seedBothPools();

		const todos = await repository.list({ campaignId: CAMPAIGN.id });

		expect(todos.total).toBe(2);
	});

	it("separa a apuração por grupo", async () => {
		await seedBothPools();

		const cd = await repository.listForDraw(CAMPAIGN.id, "cd");
		const lojas = await repository.listForDraw(CAMPAIGN.id, "unidades");
		const todos = await repository.listForDraw(CAMPAIGN.id);

		expect(cd).toHaveLength(1);
		expect(cd[0]?.storeName).toBe("Centro de Distribuição");
		expect(lojas).toHaveLength(1);
		expect(todos).toHaveLength(2);
	});

	it("conta cadastro sem grupo como 'unidades', e não como CD", async () => {
		await seedLegacyRow();

		const lojas = await repository.list({
			campaignId: CAMPAIGN.id,
			pool: "unidades",
		});
		const cd = await repository.list({ campaignId: CAMPAIGN.id, pool: "cd" });

		expect(lojas.total).toBe(1);
		expect(lojas.items[0]?.pool).toBe("unidades");
		expect(cd.total).toBe(0);
	});

	it("inclui o cadastro sem grupo na apuração das lojas", async () => {
		await seedLegacyRow();

		expect(await repository.listForDraw(CAMPAIGN.id, "unidades")).toHaveLength(
			1,
		);
		expect(await repository.listForDraw(CAMPAIGN.id, "cd")).toHaveLength(0);
	});

	// O filtro de grupo usa um `OR` próprio e a busca usa outro: se os dois
	// caíssem no mesmo nível do objeto, um sobrescreveria o outro e a busca
	// passaria a atravessar os grupos.
	it("combina busca e grupo em vez de um anular o outro", async () => {
		await seedBothPools();
		await repository.create(
			buildParticipant("(86) 98888-7777", "Carlos das Lojas"),
		);

		const encontrados = await repository.list({
			campaignId: CAMPAIGN.id,
			pool: "unidades",
			search: "Carlos",
		});

		expect(encontrados.total).toBe(1);
		expect(encontrados.items[0]?.name).toBe("Carlos das Lojas");
	});
});

describe("busca por documento", () => {
	it("encontra pelo documento mesmo digitado com pontuação", async () => {
		const parsed = PhoneNumber.create("(86) 98897-0955");

		if (!parsed.ok) {
			throw new Error("telefone de teste inválido");
		}

		const created = Participant.create({
			campaignId: CAMPAIGN.id,
			name: "Maria da Silva",
			phone: parsed.value,
			store: CENTRO,
			document: TaxDocument.restore("52998224725"),
			now: new Date("2026-08-10T12:00:00Z"),
		});

		if (!created.ok) {
			throw new Error("participante de teste inválido");
		}

		await repository.create(created.value);

		const porDocumento = await repository.list({
			campaignId: CAMPAIGN.id,
			search: "529.982.247-25",
		});

		expect(porDocumento.total).toBe(1);
		expect(porDocumento.items[0]?.document?.display).toBe("529.982.247-25");
	});
});
