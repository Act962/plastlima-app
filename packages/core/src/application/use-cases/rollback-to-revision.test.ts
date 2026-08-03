import { beforeEach, describe, expect, it } from "vitest";
import { ContentKey } from "../../domain/content/value-objects/content-key";
import { ZodContentValidator } from "../../schemas/zod-content-validator";
import {
	FixedClock,
	InMemoryContentRepository,
	RecordingAuditLogger,
	RecordingCacheInvalidator,
} from "../../testing";
import { EDITOR, VALID_HOME, VALID_HOME_EDITED } from "./content-fixtures";
import { PublishDocument } from "./publish-document";
import { RollbackToRevision } from "./rollback-to-revision";
import { SaveDraft } from "./save-draft";

const HOME = ContentKey.restore("home");
const NOW = new Date("2026-08-03T14:32:00-03:00");

let documents: InMemoryContentRepository;
let cache: RecordingCacheInvalidator;
let audit: RecordingAuditLogger;
let clock: FixedClock;
let saveDraft: SaveDraft;
let publish: PublishDocument;
let rollback: RollbackToRevision;

beforeEach(async () => {
	documents = new InMemoryContentRepository();
	const validator = new ZodContentValidator();
	cache = new RecordingCacheInvalidator();
	audit = new RecordingAuditLogger();
	clock = new FixedClock(NOW);
	saveDraft = new SaveDraft(documents, validator, clock, audit);
	publish = new PublishDocument(documents, validator, cache, clock, audit);
	rollback = new RollbackToRevision(documents, cache, clock, audit);

	// Duas publicações: v1 = VALID_HOME, v2 = VALID_HOME_EDITED.
	await saveDraft.execute({ key: "home", draft: VALID_HOME, actor: EDITOR });
	await publish.execute({ key: "home", actor: EDITOR });
	await saveDraft.execute({
		key: "home",
		draft: VALID_HOME_EDITED,
		actor: EDITOR,
	});
	await publish.execute({ key: "home", actor: EDITOR });
});

describe("invariante 3 — rollback cria nova revisão, nunca apaga histórico", () => {
	it("restaura o conteúdo da v1 criando a v3", async () => {
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

		// O publicado voltou a ser o conteúdo da v1.
		expect(await documents.findPublished(HOME)).toEqual(VALID_HOME);
	});

	it("faz o histórico crescer, não encolher", async () => {
		await rollback.execute({ key: "home", version: 1, actor: EDITOR });

		const versions = (await documents.listRevisions(HOME)).map(
			(r) => r.version,
		);

		// v1 e v2 continuam lá; a v3 é a restauração (invariante 4: sequencial).
		expect(versions).toEqual([3, 2, 1]);
	});

	it("a nova revisão carrega o conteúdo restaurado", async () => {
		await rollback.execute({ key: "home", version: 1, actor: EDITOR });

		const restored = await documents.findRevision(HOME, 3);

		expect(restored?.data).toEqual(VALID_HOME);
	});

	it("depois do rollback, publicar de novo é rejeitado sem mudança (invariante 9)", async () => {
		await rollback.execute({ key: "home", version: 1, actor: EDITOR });

		// O rollback também alinha o rascunho, então não há o que publicar.
		const result = await publish.execute({ key: "home", actor: EDITOR });

		expect(result.ok).toBe(false);

		if (!result.ok) {
			expect(result.error.code).toBe("NO_CHANGES_TO_PUBLISH");
		}
	});
});

describe("recusas do rollback", () => {
	it("recusa uma revisão inexistente", async () => {
		const result = await rollback.execute({
			key: "home",
			version: 99,
			actor: EDITOR,
		});

		expect(result.ok).toBe(false);

		if (!result.ok) {
			expect(result.error.code).toBe("REVISION_NOT_FOUND");
		}
	});

	it("registra o rollback na auditoria e invalida o cache", async () => {
		await rollback.execute({ key: "home", version: 1, actor: EDITOR });

		expect(audit.actions).toContain("content.rollback");
		expect(cache.flatTags).toContain("content:home");
	});
});
