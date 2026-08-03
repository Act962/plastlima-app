import type { ContentRevision } from "../../domain/content/entities/content-revision";
import type { UnknownContentKeyError } from "../../domain/content/errors";
import type { ContentRepository } from "../../domain/content/repositories/content-repository";
import { ContentKey } from "../../domain/content/value-objects/content-key";
import { ok, type Result } from "../../domain/shared/result";

/**
 * Lista as revisões de um documento, da mais recente para a mais antiga.
 *
 * Alimenta o drawer de histórico (spec §6.5): versão, autor, data e nota.
 */
export class ListRevisions {
	constructor(private readonly documents: ContentRepository) {}

	async execute(
		rawKey: string,
	): Promise<Result<ContentRevision[], UnknownContentKeyError>> {
		const key = ContentKey.create(rawKey);

		if (!key.ok) {
			return key;
		}

		return ok(await this.documents.listRevisions(key.value));
	}
}
