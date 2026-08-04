import {
	type Actor,
	ContentKey,
	type JsonValue,
	PublishDocument,
	RollbackToRevision,
	SaveDraft,
} from "@plastlima-app/core";
import { ZodContentValidator } from "@plastlima-app/core/schemas";
import {
	RecordingAuditLogger,
	RecordingCacheInvalidator,
} from "@plastlima-app/core/testing";
import { afterAll, beforeEach, describe, expect, inject, it } from "vitest";
import { SystemClock } from "../clock/system-clock";
import { createPrismaClient } from "./client";
import { PrismaContentRepository } from "./prisma-content-repository";

const HOME = ContentKey.restore("home");

const EDITOR: Actor = {
	id: "user-1",
	email: "joao@plastlima.com.br",
};

const VALID_HOME: JsonValue = {
	banners: [{ src: "/banners/a.jpeg", alt: "Banner de campanha", aspect: 3 }],
	stats: [{ value: "23+", label: "anos de mercado" }],
	offers: [{ src: "/offers/1.jpg", alt: "Oferta em destaque" }],
};

const VALID_HOME_EDITED: JsonValue = {
	banners: [
		{ src: "/banners/a.jpeg", alt: "Banner de campanha", aspect: 3 },
		{ src: "/banners/b.jpeg", alt: "Segundo banner", aspect: 3 },
	],
	stats: [{ value: "23+", label: "anos de mercado" }],
	offers: [{ src: "/offers/1.jpg", alt: "Oferta em destaque" }],
};

const prisma = createPrismaClient(inject("databaseUrl"));
const repository = new PrismaContentRepository(prisma);
const validator = new ZodContentValidator();
const clock = new SystemClock();

function newSaveDraft(audit: RecordingAuditLogger): SaveDraft {
	return new SaveDraft(repository, validator, clock, audit);
}

function newPublish(
	cache: RecordingCacheInvalidator,
	audit: RecordingAuditLogger,
): PublishDocument {
	return new PublishDocument(repository, validator, cache, clock, audit);
}

beforeEach(async () => {
	// Revisões antes dos documentos: a revisão referencia o documento.
	await prisma.contentRevision.deleteMany({});
	await prisma.contentDocument.deleteMany({});
});

afterAll(async () => {
	await prisma.$disconnect();
});

describe("mapper", () => {
	it("preserva rascunho e metadados na ida e na volta", async () => {
		const audit = new RecordingAuditLogger();

		await newSaveDraft(audit).execute({
			key: "home",
			draft: VALID_HOME,
			actor: EDITOR,
		});

		const loaded = await repository.findByKey(HOME);

		expect(loaded?.draft).toEqual(VALID_HOME);
		expect(loaded?.published).toBeNull();
		expect(loaded?.currentVersion).toBe(0);
		expect(loaded?.schemaVersion).toBe(1);
		expect(loaded?.publishState().value).toBe("UNPUBLISHED");
	});

	it("findPublished devolve null enquanto nunca publicado", async () => {
		const audit = new RecordingAuditLogger();

		await newSaveDraft(audit).execute({
			key: "home",
			draft: VALID_HOME,
			actor: EDITOR,
		});

		expect(await repository.findPublished(HOME)).toBeNull();
	});

	it("findByKey devolve null para documento inexistente", async () => {
		expect(await repository.findByKey(HOME)).toBeNull();
	});
});

describe("publicação e sequência de versões", () => {
	it("grava documento e revisão juntos, incrementando a version", async () => {
		const audit = new RecordingAuditLogger();
		const cache = new RecordingCacheInvalidator();
		const saveDraft = newSaveDraft(audit);
		const publish = newPublish(cache, audit);

		await saveDraft.execute({ key: "home", draft: VALID_HOME, actor: EDITOR });
		const first = await publish.execute({ key: "home", actor: EDITOR });

		expect(first.ok).toBe(true);
		if (first.ok) {
			expect(first.value.version).toBe(1);
		}

		await saveDraft.execute({
			key: "home",
			draft: VALID_HOME_EDITED,
			actor: EDITOR,
		});
		const second = await publish.execute({ key: "home", actor: EDITOR });

		if (second.ok) {
			expect(second.value.version).toBe(2);
		}

		const versions = (await repository.listRevisions(HOME)).map(
			(revision) => revision.version,
		);

		expect(versions).toEqual([2, 1]);
		expect(await repository.findPublished(HOME)).toEqual(VALID_HOME_EDITED);
	});

	it("a revisão guarda o conteúdo e a versão de schema daquele momento", async () => {
		const audit = new RecordingAuditLogger();
		const cache = new RecordingCacheInvalidator();

		await newSaveDraft(audit).execute({
			key: "home",
			draft: VALID_HOME,
			actor: EDITOR,
		});
		await newPublish(cache, audit).execute({ key: "home", actor: EDITOR });

		const revision = await repository.findRevision(HOME, 1);

		expect(revision?.data).toEqual(VALID_HOME);
		expect(revision?.schemaVersion).toBe(1);
		expect(revision?.createdBy).toBe(EDITOR.email);
	});
});

describe("unicidade (documentId, version)", () => {
	it("barra duas revisões com a mesma version no mesmo documento", async () => {
		const audit = new RecordingAuditLogger();
		const cache = new RecordingCacheInvalidator();

		await newSaveDraft(audit).execute({
			key: "home",
			draft: VALID_HOME,
			actor: EDITOR,
		});
		await newPublish(cache, audit).execute({ key: "home", actor: EDITOR });

		const document = await prisma.contentDocument.findUniqueOrThrow({
			where: { key: "home" },
		});

		await expect(
			prisma.contentRevision.create({
				data: {
					documentId: document.id,
					version: 1, // já existe
					data: VALID_HOME as object,
					schemaVersion: 1,
					createdBy: EDITOR.email,
					createdAt: new Date(),
				},
			}),
		).rejects.toMatchObject({ code: "P2002" });
	});
});

describe("atomicidade de persistPublication", () => {
	it("não promove o documento se a inserção da revisão falha", async () => {
		const audit = new RecordingAuditLogger();
		const cache = new RecordingCacheInvalidator();

		// v1 publicada.
		await newSaveDraft(audit).execute({
			key: "home",
			draft: VALID_HOME,
			actor: EDITOR,
		});
		await newPublish(cache, audit).execute({ key: "home", actor: EDITOR });

		// Simula uma publicação concorrente que já tomou a version 2.
		const stored = await prisma.contentDocument.findUniqueOrThrow({
			where: { key: "home" },
		});
		await prisma.contentRevision.create({
			data: {
				documentId: stored.id,
				version: 2,
				data: VALID_HOME as object,
				schemaVersion: 1,
				createdBy: "outra@plastlima.com.br",
				createdAt: new Date(),
			},
		});

		// Agora tentamos publicar a nossa v2 — a revisão colide e a transação
		// inteira deve reverter.
		const document = await repository.findByKey(HOME);
		if (document === null) {
			throw new Error("documento não encontrado");
		}
		document.saveDraft(VALID_HOME_EDITED, EDITOR, clock.now());
		const revision = document.publish(EDITOR, clock.now());

		await expect(
			repository.persistPublication(document, revision),
		).rejects.toMatchObject({ code: "P2002" });

		// O documento continua na v1, com o conteúdo antigo publicado.
		const reloaded = await prisma.contentDocument.findUniqueOrThrow({
			where: { key: "home" },
		});
		expect(reloaded.currentVersion).toBe(1);
		expect(reloaded.published).toEqual(VALID_HOME);
	});
});

describe("ciclo completo via casos de uso, contra o banco real", () => {
	it("save → publish → editar → publish → rollback", async () => {
		const audit = new RecordingAuditLogger();
		const cache = new RecordingCacheInvalidator();
		const saveDraft = newSaveDraft(audit);
		const publish = newPublish(cache, audit);
		const rollback = new RollbackToRevision(repository, cache, clock, audit);

		await saveDraft.execute({ key: "home", draft: VALID_HOME, actor: EDITOR });
		await publish.execute({ key: "home", actor: EDITOR });

		await saveDraft.execute({
			key: "home",
			draft: VALID_HOME_EDITED,
			actor: EDITOR,
		});
		await publish.execute({ key: "home", actor: EDITOR });

		expect(await repository.findPublished(HOME)).toEqual(VALID_HOME_EDITED);

		const result = await rollback.execute({
			key: "home",
			version: 1,
			actor: EDITOR,
		});

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.version).toBe(3);
			expect(result.value.restoredFrom).toBe(1);
		}

		// Publicado voltou ao conteúdo da v1; histórico cresceu para 3 revisões.
		expect(await repository.findPublished(HOME)).toEqual(VALID_HOME);
		const versions = (await repository.listRevisions(HOME)).map(
			(revision) => revision.version,
		);
		expect(versions).toEqual([3, 2, 1]);

		// A invalidação de cache aconteceu a cada publicação e no rollback.
		expect(cache.flatTags).toEqual([
			"content:home",
			"content:home",
			"content:home",
		]);
		expect(audit.actions).toContain("content.publish");
		expect(audit.actions).toContain("content.rollback");
	});
});
