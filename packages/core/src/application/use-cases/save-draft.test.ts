import { beforeEach, describe, expect, it } from "vitest";
import { ContentKey } from "../../domain/content/value-objects/content-key";
import { ZodContentValidator } from "../../schemas/zod-content-validator";
import {
	FixedClock,
	InMemoryContentRepository,
	RecordingAuditLogger,
} from "../../testing";
import { EDITOR, INVALID_HOME, VALID_HOME } from "./content-fixtures";
import { GetDraft } from "./get-draft";
import { SaveDraft } from "./save-draft";

const HOME = ContentKey.restore("home");
const NOW = new Date("2026-08-03T14:32:00-03:00");

let documents: InMemoryContentRepository;
let audit: RecordingAuditLogger;
let clock: FixedClock;
let saveDraft: SaveDraft;
let getDraft: GetDraft;

beforeEach(() => {
	documents = new InMemoryContentRepository();
	audit = new RecordingAuditLogger();
	clock = new FixedClock(NOW);
	saveDraft = new SaveDraft(documents, new ZodContentValidator(), clock, audit);
	getDraft = new GetDraft(documents);
});

describe("autosave do rascunho", () => {
	it("cria o documento na primeira gravação", async () => {
		const result = await saveDraft.execute({
			key: "home",
			draft: VALID_HOME,
			actor: EDITOR,
		});

		expect(result.ok).toBe(true);
		expect(documents.size).toBe(1);

		if (result.ok) {
			expect(result.value.draft).toEqual(VALID_HOME);
			// Rascunho salvo nunca publica sozinho.
			expect(result.value.published).toBeNull();
		}
	});

	it("aceita rascunho incompleto — a validação de shape é só na publicação", async () => {
		const result = await saveDraft.execute({
			key: "home",
			draft: INVALID_HOME,
			actor: EDITOR,
		});

		expect(result.ok).toBe(true);
	});

	it("atualiza o mesmo documento em gravações seguintes, sem duplicar", async () => {
		await saveDraft.execute({ key: "home", draft: VALID_HOME, actor: EDITOR });
		await saveDraft.execute({
			key: "home",
			draft: INVALID_HOME,
			actor: EDITOR,
		});

		expect(documents.size).toBe(1);

		const loaded = await documents.findByKey(HOME);

		expect(loaded?.draft).toEqual(INVALID_HOME);
	});

	it("recusa uma key desconhecida", async () => {
		const result = await saveDraft.execute({
			key: "inexistente",
			draft: VALID_HOME,
			actor: EDITOR,
		});

		expect(result.ok).toBe(false);

		if (!result.ok) {
			expect(result.error.code).toBe("UNKNOWN_CONTENT_KEY");
		}
	});

	it("registra a gravação na auditoria", async () => {
		await saveDraft.execute({ key: "home", draft: VALID_HOME, actor: EDITOR });

		expect(audit.actions).toContain("content.save");
	});
});

describe("GetDraft", () => {
	it("carrega o documento salvo", async () => {
		await saveDraft.execute({ key: "home", draft: VALID_HOME, actor: EDITOR });

		const result = await getDraft.execute("home");

		expect(result.ok).toBe(true);

		if (result.ok) {
			expect(result.value.key.value).toBe("home");
			expect(result.value.publishState().value).toBe("UNPUBLISHED");
		}
	});

	it("falha quando o documento ainda não existe", async () => {
		const result = await getDraft.execute("home");

		expect(result.ok).toBe(false);

		if (!result.ok) {
			expect(result.error.code).toBe("CONTENT_DOCUMENT_NOT_FOUND");
		}
	});
});
