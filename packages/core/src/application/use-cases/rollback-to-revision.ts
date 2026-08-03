import {
	ContentDocumentNotFoundError,
	RevisionNotFoundError,
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

export type RollbackToRevisionInput = {
	key: string;
	version: number;
	actor: Actor;
};

export type RollbackToRevisionOutput = {
	/** Número da revisão **nova** criada pela restauração. */
	version: number;
	/** Número da revisão restaurada. */
	restoredFrom: number;
};

type RollbackError =
	| UnknownContentKeyError
	| ContentDocumentNotFoundError
	| RevisionNotFoundError;

/**
 * Restaura um documento para o conteúdo de uma revisão anterior.
 *
 * Nunca apaga histórico (invariante 3): a restauração promove o conteúdo antigo
 * a publicado criando uma **revisão nova** — o histórico só cresce. Como o
 * conteúdo já foi validado quando aquela revisão foi criada, não há revalidação
 * de shape aqui.
 */
export class RollbackToRevision {
	constructor(
		private readonly documents: ContentRepository,
		private readonly cache: CacheInvalidator,
		private readonly clock: Clock,
		private readonly audit: AuditLogger,
	) {}

	async execute(
		input: RollbackToRevisionInput,
	): Promise<Result<RollbackToRevisionOutput, RollbackError>> {
		const parsedKey = ContentKey.create(input.key);

		if (!parsedKey.ok) {
			return parsedKey;
		}

		const key = parsedKey.value;
		const document = await this.documents.findByKey(key);

		if (document === null) {
			return fail(new ContentDocumentNotFoundError(input.key));
		}

		const target = await this.documents.findRevision(key, input.version);

		if (target === null) {
			return fail(new RevisionNotFoundError(key.value, input.version));
		}

		const now = this.clock.now();
		const revision = document.rollbackTo(target, input.actor, now);

		await this.documents.persistPublication(document, revision);

		await this.audit.record({
			actor: input.actor,
			action: "content.rollback",
			entityType: "ContentDocument",
			entityId: key.value,
			diff: { version: revision.version, restoredFrom: target.version },
		});

		await this.cache.invalidate([contentCacheTag(key.value)]);

		return ok({ version: revision.version, restoredFrom: target.version });
	}
}
