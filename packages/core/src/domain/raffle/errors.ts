/**
 * Erros de domínio da campanha.
 *
 * Cada um carrega um `code` estável — a interface mapeia o código para a
 * mensagem que o usuário vê, sem depender do texto do `message`, que existe
 * para log e para o teste.
 */
export abstract class DomainError extends Error {
	abstract readonly code: string;

	constructor(message: string) {
		super(message);
		this.name = new.target.name;
	}
}

/** O telefone informado não é um número brasileiro válido. */
export class InvalidPhoneError extends DomainError {
	readonly code = "INVALID_PHONE";

	constructor(readonly reason: string) {
		super(`Telefone inválido: ${reason}`);
	}
}

/** O CPF/CNPJ informado não passa na checagem dos dígitos verificadores. */
export class InvalidDocumentError extends DomainError {
	readonly code = "INVALID_DOCUMENT";

	constructor(readonly reason: string) {
		super(`Documento inválido: ${reason}`);
	}
}

/** Os dados do participante não satisfazem as invariantes da entidade. */
export class InvalidParticipantError extends DomainError {
	readonly code = "INVALID_PARTICIPANT";

	constructor(readonly reason: string) {
		super(`Participante inválido: ${reason}`);
	}
}

/** O `storeId` enviado não corresponde a nenhuma loja conhecida. */
export class UnknownStoreError extends DomainError {
	readonly code = "UNKNOWN_STORE";

	constructor(readonly storeId: string) {
		super(`Loja desconhecida: ${storeId}`);
	}
}

/** As inscrições já encerraram. */
export class CampaignClosedError extends DomainError {
	readonly code = "CAMPAIGN_CLOSED";

	constructor(readonly closedAt: Date) {
		super(`Inscrições encerradas em ${closedAt.toISOString()}`);
	}
}

/**
 * O repositório recusou a criação porque já existe participante com esse
 * telefone na campanha. Traduzido pela infraestrutura a partir da violação do
 * índice único — é o que permite ao caso de uso tratar submissões simultâneas.
 */
export class DuplicateParticipantError extends DomainError {
	readonly code = "DUPLICATE_PARTICIPANT";

	constructor(readonly phone: string) {
		super(`Participante já cadastrado: ${phone}`);
	}
}

export type RegistrationError =
	| InvalidPhoneError
	| InvalidDocumentError
	| InvalidParticipantError
	| UnknownStoreError
	| CampaignClosedError;

/** A semente do sorteio não foi informada. */
export class MissingSeedError extends DomainError {
	readonly code = "MISSING_SEED";

	constructor() {
		super("Semente do sorteio não informada");
	}
}

/** Não há ninguém elegível para sortear. */
export class EmptyDrawError extends DomainError {
	readonly code = "EMPTY_DRAW";

	constructor() {
		super("Nenhum participante elegível");
	}
}

export type DrawError = MissingSeedError | EmptyDrawError;
