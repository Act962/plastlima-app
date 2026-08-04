import { DomainError } from "../raffle/errors";

/** O arquivo enviado não passou nas regras de mídia (alt, dimensões, tamanho). */
export class InvalidMediaError extends DomainError {
	readonly code = "INVALID_MEDIA";

	constructor(readonly reason: string) {
		super(reason);
	}
}

/** O arquivo de mídia pedido (para excluir) não existe. */
export class MediaNotFoundError extends DomainError {
	readonly code = "MEDIA_NOT_FOUND";

	constructor(readonly id: string) {
		super(`Mídia não encontrada: ${id}`);
	}
}

export type MediaError = InvalidMediaError | MediaNotFoundError;
