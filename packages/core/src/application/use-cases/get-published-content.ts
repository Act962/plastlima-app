import type { UnknownContentKeyError } from "../../domain/content/errors";
import type { ContentRepository } from "../../domain/content/repositories/content-repository";
import { ContentKey } from "../../domain/content/value-objects/content-key";
import type { JsonValue } from "../../domain/shared/json";
import { ok, type Result } from "../../domain/shared/result";

/**
 * Devolve o JSON publicado de um documento, para o site consumir.
 *
 * Retorna `null` quando o documento não existe ou nunca foi publicado — o
 * chamador (as funções de `apps/web/src/lib/content/`) cai no fallback em código.
 * A validação do shape na leitura é responsabilidade daquela camada, não deste
 * caso de uso: o site nunca deve cair por causa do banco (spec §7.1).
 */
export class GetPublishedContent {
	constructor(private readonly documents: ContentRepository) {}

	async execute(
		rawKey: string,
	): Promise<Result<JsonValue | null, UnknownContentKeyError>> {
		const key = ContentKey.create(rawKey);

		if (!key.ok) {
			return key;
		}

		return ok(await this.documents.findPublished(key.value));
	}
}
