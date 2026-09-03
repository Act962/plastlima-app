import { DomainError } from "../raffle/errors";

/** Os dados do lead não satisfazem as invariantes da entidade. */
export class InvalidLeadError extends DomainError {
	readonly code = "INVALID_LEAD";

	constructor(readonly reason: string) {
		super(`Lead inválido: ${reason}`);
	}
}

/** O lead pedido (para mudar de status) não existe. */
export class LeadNotFoundError extends DomainError {
	readonly code = "LEAD_NOT_FOUND";

	constructor(readonly id: string) {
		super(`Lead não encontrado: ${id}`);
	}
}

export type LeadError = InvalidLeadError | LeadNotFoundError;
