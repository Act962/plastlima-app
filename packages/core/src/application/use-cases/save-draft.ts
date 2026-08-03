import { ContentDocument } from "../../domain/content/entities/content-document";
import type { UnknownContentKeyError } from "../../domain/content/errors";
import type { ContentRepository } from "../../domain/content/repositories/content-repository";
import { ContentKey } from "../../domain/content/value-objects/content-key";
import type { Actor } from "../../domain/shared/actor";
import type { JsonValue } from "../../domain/shared/json";
import { ok, type Result } from "../../domain/shared/result";
import type { AuditLogger } from "../ports/audit-logger";
import type { Clock } from "../ports/clock";
import type { ContentValidator } from "../ports/content-validator";

export type SaveDraftInput = {
	key: string;
	draft: JsonValue;
	actor: Actor;
};

/**
 * Grava o rascunho de um documento (autosave da tela de edição).
 *
 * De propósito **não valida o shape**: o rascunho pode estar incompleto no meio
 * da edição, e nada disso afeta o site até publicar. A validação estrita é da
 * `PublishDocument`. Se o documento ainda não existe, é criado na hora com a
 * versão de schema atual da `key`.
 */
export class SaveDraft {
	constructor(
		private readonly documents: ContentRepository,
		private readonly validator: ContentValidator,
		private readonly clock: Clock,
		private readonly audit: AuditLogger,
	) {}

	async execute(
		input: SaveDraftInput,
	): Promise<Result<ContentDocument, UnknownContentKeyError>> {
		const parsedKey = ContentKey.create(input.key);

		if (!parsedKey.ok) {
			return parsedKey;
		}

		const key = parsedKey.value;
		const now = this.clock.now();
		const existing = await this.documents.findByKey(key);

		const document =
			existing ??
			ContentDocument.create({
				key,
				schemaVersion: this.validator.schemaVersion(key),
				draft: input.draft,
				actor: input.actor,
				now,
			});

		if (existing !== null) {
			document.saveDraft(input.draft, input.actor, now);
		}

		const saved = await this.documents.saveDraft(document);

		await this.audit.record({
			actor: input.actor,
			action: "content.save",
			entityType: "ContentDocument",
			entityId: key.value,
		});

		return ok(saved);
	}
}
