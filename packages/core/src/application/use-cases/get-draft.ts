import type { ContentDocument } from "../../domain/content/entities/content-document";
import {
	ContentDocumentNotFoundError,
	type UnknownContentKeyError,
} from "../../domain/content/errors";
import type { ContentRepository } from "../../domain/content/repositories/content-repository";
import { ContentKey } from "../../domain/content/value-objects/content-key";
import { fail, ok, type Result } from "../../domain/shared/result";

type GetDraftError = UnknownContentKeyError | ContentDocumentNotFoundError;

/**
 * Carrega o documento completo (rascunho + publicado + metadados) para edição.
 *
 * Retorna o `ContentDocument` inteiro, não só o rascunho: a tela de edição
 * precisa do estado de publicação para o badge e o botão *Publicar*.
 */
export class GetDraft {
	constructor(private readonly documents: ContentRepository) {}

	async execute(
		rawKey: string,
	): Promise<Result<ContentDocument, GetDraftError>> {
		const key = ContentKey.create(rawKey);

		if (!key.ok) {
			return key;
		}

		const document = await this.documents.findByKey(key.value);

		if (document === null) {
			return fail(new ContentDocumentNotFoundError(rawKey));
		}

		return ok(document);
	}
}
