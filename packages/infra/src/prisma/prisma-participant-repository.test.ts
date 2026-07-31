import {
	DuplicateParticipantError,
	Participant,
	PhoneNumber,
	type RaffleCampaign,
	type RaffleStore,
	RegisterParticipation,
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
};

const CAMPAIGN: RaffleCampaign = {
	id: "kit-churrasco-2026",
	entriesCloseAt: new Date("2099-12-31T00:00:00Z"),
};

const prisma = createPrismaClient(inject("databaseUrl"));
const repository = new PrismaParticipantRepository(prisma);

function buildParticipant(phone: string, name = "Maria da Silva"): Participant {
	const parsed = PhoneNumber.create(phone);

	if (!parsed.ok) {
		throw new Error(`telefone de teste inválido: ${phone}`);
	}

	const participant = Participant.create({
		campaignId: CAMPAIGN.id,
		name,
		phone: parsed.value,
		store: CENTRO,
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
