import { DomainError } from "../raffle/errors";

export { DomainError };

/** O `key` informado não corresponde a nenhuma área de conteúdo do site. */
export class UnknownContentKeyError extends DomainError {
	readonly code = "UNKNOWN_CONTENT_KEY";

	constructor(readonly key: string) {
		super(`Chave de conteúdo desconhecida: ${key}`);
	}
}

/** Não existe documento para a `key` pedida. */
export class ContentDocumentNotFoundError extends DomainError {
	readonly code = "CONTENT_DOCUMENT_NOT_FOUND";

	constructor(readonly key: string) {
		super(`Documento de conteúdo não encontrado: ${key}`);
	}
}

/**
 * O conteúdo não passou no schema Zod da respectiva `key`.
 *
 * Carrega a lista de problemas (`caminho: mensagem`) para a interface apontar o
 * campo, em vez de mostrar "conteúdo inválido" e deixar o editor adivinhar.
 */
export class InvalidContentError extends DomainError {
	readonly code = "INVALID_CONTENT";

	constructor(
		readonly key: string,
		readonly issues: readonly ContentIssue[],
	) {
		super(`Conteúdo inválido para '${key}': ${issues.length} problema(s)`);
	}
}

export type ContentIssue = {
	/** Caminho do campo, ex.: `banners.0.alt`. */
	path: string;
	message: string;
};

/**
 * Publicar foi recusado porque o rascunho é idêntico ao publicado (invariante
 * 9). Evita criar revisão vazia e reflete o botão *Publicar* desabilitado na UI.
 */
export class NoChangesToPublishError extends DomainError {
	readonly code = "NO_CHANGES_TO_PUBLISH";

	constructor(readonly key: string) {
		super(`Nada a publicar em '${key}': o rascunho é igual ao publicado`);
	}
}

/** A revisão pedida (para restaurar ou consultar) não existe no documento. */
export class RevisionNotFoundError extends DomainError {
	readonly code = "REVISION_NOT_FOUND";

	constructor(
		readonly key: string,
		readonly version: number,
	) {
		super(`Revisão ${version} não encontrada em '${key}'`);
	}
}

export type ContentError =
	| UnknownContentKeyError
	| ContentDocumentNotFoundError
	| InvalidContentError
	| NoChangesToPublishError
	| RevisionNotFoundError;
