import {
	ContentDocumentNotFoundError,
	type InvalidContentError,
	NoChangesToPublishError,
	type UnknownContentKeyError,
} from "../../domain/content/errors";
import type { ContentRepository } from "../../domain/content/repositories/content-repository";
import { ContentKey } from "../../domain/content/value-objects/content-key";
import type { Actor } from "../../domain/shared/actor";
import { fail, ok, type Result } from "../../domain/shared/result";
import type { AuditLogger } from "../ports/audit-logger";
import {
	type CacheInvalidator,
	contentCacheTag,
} from "../ports/cache-invalidator";
import type { Clock } from "../ports/clock";
import type { ContentValidator } from "../ports/content-validator";

export type PublishDocumentInput = {
	key: string;
	actor: Actor;
	/** Nota opcional que aparece no histórico. */
	note?: string | null;
};

export type PublishDocumentOutput = {
	/** Número da revisão criada por esta publicação. */
	version: number;
};

type PublishDocumentError =
	| UnknownContentKeyError
	| ContentDocumentNotFoundError
	| InvalidContentError
	| NoChangesToPublishError;

/**
 * Publica o rascunho de um documento — o coração do sistema.
 *
 * Concentra três invariantes e a ordem entre os passos importa:
 *  1. valida o rascunho contra o schema Zod da `key` (invariante 1);
 *  9. recusa se não há diferença para o publicado (invariante 9);
 *  2. promove `draft → published` criando uma revisão com `version` incrementada
 *     (invariantes 2 e 4), persistida atomicamente com o documento;
 *  — registra a auditoria e, **por último**, invalida o cache do site. Invalidar
 *     antes de persistir serviria conteúdo velho.
 */
export class PublishDocument {
	constructor(
		private readonly documents: ContentRepository,
		private readonly validator: ContentValidator,
		private readonly cache: CacheInvalidator,
		private readonly clock: Clock,
		private readonly audit: AuditLogger,
	) {}

	async execute(
		input: PublishDocumentInput,
	): Promise<Result<PublishDocumentOutput, PublishDocumentError>> {
		const parsedKey = ContentKey.create(input.key);

		if (!parsedKey.ok) {
			return parsedKey;
		}

		const key = parsedKey.value;
		const document = await this.documents.findByKey(key);

		if (document === null) {
			return fail(new ContentDocumentNotFoundError(input.key));
		}

		// Invariante 1: só publica o que passa no schema da respectiva key.
		const validation = this.validator.validate(key, document.draft);

		if (!validation.ok) {
			return validation;
		}

		// Invariante 9: rascunho idêntico ao publicado não vira revisão vazia.
		if (!document.hasUnpublishedChanges()) {
			return fail(new NoChangesToPublishError(key.value));
		}

		const now = this.clock.now();
		const revision = document.publish(input.actor, now, input.note);

		await this.documents.persistPublication(document, revision);

		await this.audit.record({
			actor: input.actor,
			action: "content.publish",
			entityType: "ContentDocument",
			entityId: key.value,
			diff: { version: revision.version },
		});

		// Por último: agora o publicado no banco já é o novo conteúdo.
		await this.cache.invalidate([contentCacheTag(key.value)]);

		return ok({ version: revision.version });
	}
}
