import { beforeEach, describe, expect, it } from "vitest";
import { ContentKey } from "../../domain/content/value-objects/content-key";
import { ZodContentValidator } from "../../schemas/zod-content-validator";
import {
	FixedClock,
	InMemoryContentRepository,
	RecordingAuditLogger,
	RecordingCacheInvalidator,
} from "../../testing";
import {
	EDITOR,
	INVALID_HOME,
	VALID_HOME,
	VALID_HOME_EDITED,
} from "./content-fixtures";
import { PublishDocument } from "./publish-document";
import { SaveDraft } from "./save-draft";

const HOME = ContentKey.restore("home");
const NOW = new Date("2026-08-03T14:32:00-03:00");

let documents: InMemoryContentRepository;
let validator: ZodContentValidator;
let cache: RecordingCacheInvalidator;
let audit: RecordingAuditLogger;
let clock: FixedClock;
let saveDraft: SaveDraft;
let publish: PublishDocument;

beforeEach(() => {
	documents = new InMemoryContentRepository();
	validator = new ZodContentValidator();
	cache = new RecordingCacheInvalidator();
	audit = new RecordingAuditLogger();
	clock = new FixedClock(NOW);
	saveDraft = new SaveDraft(documents, validator, clock, audit);
	publish = new PublishDocument(documents, validator, cache, clock, audit);
});

async function seed(draft: unknown): Promise<void> {
	const result = await saveDraft.execute({
		key: "home",
		draft: draft as never,
		actor: EDITOR,
	});

	if (!result.ok) {
		throw new Error("seed do rascunho falhou");
	}
}

describe("invariante 1 — publicar exige rascunho válido no schema Zod", () => {
	it("recusa publicação quando o rascunho não passa no schema", async () => {
		await seed(INVALID_HOME);

		const result = await publish.execute({ key: "home", actor: EDITOR });

		expect(result.ok).toBe(false);

		if (!result.ok) {
			expect(result.error.code).toBe("INVALID_CONTENT");
		}

		// Nada foi publicado nem invalidado.
		expect(await documents.findPublished(HOME)).toBeNull();
		expect(cache.flatTags).toHaveLength(0);
	});

	it("aponta o campo problemático, para a interface destacar", async () => {
		await seed(INVALID_HOME);

		const result = await publish.execute({ key: "home", actor: EDITOR });

		if (!result.ok && result.error.code === "INVALID_CONTENT") {
			expect(result.error.issues).toContainEqual(
				expect.objectContaining({ path: "banners.0.alt" }),
			);
		} else {
			throw new Error("esperava InvalidContentError");
		}
	});
});

describe("invariante 2 — publicar sempre cria revisão com version incrementada", () => {
	it("cria a revisão 1 na primeira publicação", async () => {
		await seed(VALID_HOME);

		const result = await publish.execute({ key: "home", actor: EDITOR });

		expect(result.ok).toBe(true);

		if (result.ok) {
			expect(result.value.version).toBe(1);
		}

		const revisions = await documents.listRevisions(HOME);

		expect(revisions).toHaveLength(1);
		expect(revisions[0]?.version).toBe(1);
		expect(revisions[0]?.data).toEqual(VALID_HOME);
	});

	it("incrementa a version a cada publicação", async () => {
		await seed(VALID_HOME);
		await publish.execute({ key: "home", actor: EDITOR });

		await seed(VALID_HOME_EDITED);
		const second = await publish.execute({ key: "home", actor: EDITOR });

		if (second.ok) {
			expect(second.value.version).toBe(2);
		}

		const versions = (await documents.listRevisions(HOME)).map(
			(r) => r.version,
		);

		// Da mais recente para a mais antiga, estritamente sequencial (invariante 4).
		expect(versions).toEqual([2, 1]);
	});
});

describe("invariante 9 — publicar sem alteração é rejeitado", () => {
	it("recusa a segunda publicação quando o rascunho não mudou", async () => {
		await seed(VALID_HOME);
		await publish.execute({ key: "home", actor: EDITOR });

		const again = await publish.execute({ key: "home", actor: EDITOR });

		expect(again.ok).toBe(false);

		if (!again.ok) {
			expect(again.error.code).toBe("NO_CHANGES_TO_PUBLISH");
		}

		// Continua com uma única revisão — nenhuma revisão vazia foi criada.
		expect(await documents.listRevisions(HOME)).toHaveLength(1);
	});
});

describe("efeitos colaterais da publicação", () => {
	it("invalida o cache do site com a tag do documento", async () => {
		await seed(VALID_HOME);

		await publish.execute({ key: "home", actor: EDITOR });

		expect(cache.flatTags).toEqual(["content:home"]);
	});

	it("invalida o cache só depois de persistir o novo publicado", async () => {
		await seed(VALID_HOME);

		let publishedAtInvalidation: unknown;
		cache.onInvalidate = () => {
			publishedAtInvalidation = documents.currentPublished("home");
		};

		await publish.execute({ key: "home", actor: EDITOR });

		// No instante da invalidação, o banco já servia o conteúdo novo.
		expect(publishedAtInvalidation).toEqual(VALID_HOME);
	});

	it("registra a publicação na auditoria", async () => {
		await seed(VALID_HOME);

		await publish.execute({ key: "home", actor: EDITOR });

		expect(audit.actions).toContain("content.publish");
	});

	it("recusa uma key desconhecida", async () => {
		const result = await publish.execute({ key: "inexistente", actor: EDITOR });

		expect(result.ok).toBe(false);

		if (!result.ok) {
			expect(result.error.code).toBe("UNKNOWN_CONTENT_KEY");
		}
	});

	it("recusa publicar um documento que não existe", async () => {
		const result = await publish.execute({ key: "home", actor: EDITOR });

		expect(result.ok).toBe(false);

		if (!result.ok) {
			expect(result.error.code).toBe("CONTENT_DOCUMENT_NOT_FOUND");
		}
	});
});
