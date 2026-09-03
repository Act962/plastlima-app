import { fail, ok, type Result } from "../../shared/result";
import { InvalidDocumentError } from "../errors";

const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;

export type TaxDocumentKind = "cpf" | "cnpj";

/**
 * CPF ou CNPJ informado no cadastro da campanha.
 *
 * O campo é opcional para o participante, mas quando preenchido é validado pelos
 * dígitos verificadores — e não só pelo tamanho. Um documento que "parece certo"
 * mas não fecha a conta é quase sempre erro de digitação, e descobrir isso na
 * hora de entregar o prêmio é tarde demais.
 *
 * `value` guarda só os dígitos para a busca do painel funcionar independente de
 * como a pessoa digitou; `display` guarda a forma legível para a equipe copiar.
 */
export class TaxDocument {
	private constructor(
		/** Apenas dígitos — ex.: `12345678909`. É o que o painel busca. */
		readonly value: string,
		/** Formato legível — ex.: `123.456.789-09`. */
		readonly display: string,
		readonly kind: TaxDocumentKind,
	) {}

	static create(raw: string): Result<TaxDocument, InvalidDocumentError> {
		const digits = raw.replace(/\D/g, "");

		if (digits.length === 0) {
			return fail(new InvalidDocumentError("informe o documento"));
		}

		if (digits.length === CPF_LENGTH) {
			return isValidCpf(digits)
				? ok(new TaxDocument(digits, formatCpf(digits), "cpf"))
				: fail(new InvalidDocumentError("CPF não confere"));
		}

		if (digits.length === CNPJ_LENGTH) {
			return isValidCnpj(digits)
				? ok(new TaxDocument(digits, formatCnpj(digits), "cnpj"))
				: fail(new InvalidDocumentError("CNPJ não confere"));
		}

		return fail(
			new InvalidDocumentError("informe 11 dígitos (CPF) ou 14 (CNPJ)"),
		);
	}

	/** Atalho para validação em schema, quando o valor normalizado não interessa. */
	static isValid(raw: string): boolean {
		return TaxDocument.create(raw).ok;
	}

	/**
	 * Reconstitui a partir de um valor já persistido.
	 *
	 * Lança em vez de retornar `Result` pelo mesmo motivo do `PhoneNumber`: dado
	 * inválido vindo do nosso próprio banco é corrupção, não entrada de usuário.
	 */
	static restore(digits: string): TaxDocument {
		const result = TaxDocument.create(digits);

		if (!result.ok) {
			throw new Error(`Documento persistido em formato inválido: ${digits}`);
		}

		return result.value;
	}

	/**
	 * Máscara progressiva para o campo de digitação: vira CPF até 11 dígitos e
	 * CNPJ a partir do 12º. Aceita entrada parcial e nunca lança — a validação de
	 * verdade é `create`.
	 */
	static mask(raw: string): string {
		const digits = raw.replace(/\D/g, "").slice(0, CNPJ_LENGTH);

		return digits.length <= CPF_LENGTH ? maskCpf(digits) : maskCnpj(digits);
	}

	toString(): string {
		return this.value;
	}
}

function maskCpf(digits: string): string {
	if (digits.length <= 3) {
		return digits;
	}

	if (digits.length <= 6) {
		return `${digits.slice(0, 3)}.${digits.slice(3)}`;
	}

	if (digits.length <= 9) {
		return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
	}

	return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskCnpj(digits: string): string {
	if (digits.length <= 12) {
		return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
	}

	return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatCpf(digits: string): string {
	return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCnpj(digits: string): string {
	return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Dígitos verificadores do CPF (módulo 11).
 *
 * A rejeição de sequências repetidas (`111.111.111-11`) é obrigatória: elas
 * passam no cálculo dos dígitos, mas não são CPFs válidos.
 */
function isValidCpf(digits: string): boolean {
	if (/^(\d)\1{10}$/.test(digits)) {
		return false;
	}

	for (const [length, start] of [
		[9, 10],
		[10, 11],
	] as const) {
		let sum = 0;

		for (let index = 0; index < length; index += 1) {
			sum += Number(digits[index]) * (start - index);
		}

		const remainder = (sum * 10) % 11;
		const expected = remainder === 10 ? 0 : remainder;

		if (expected !== Number(digits[length])) {
			return false;
		}
	}

	return true;
}

/** Dígitos verificadores do CNPJ (módulo 11, pesos de 2 a 9 ciclando). */
function isValidCnpj(digits: string): boolean {
	if (/^(\d)\1{13}$/.test(digits)) {
		return false;
	}

	for (const length of [12, 13]) {
		let sum = 0;
		let weight = length - 7;

		for (let index = 0; index < length; index += 1) {
			sum += Number(digits[index]) * weight;
			weight = weight === 2 ? 9 : weight - 1;
		}

		const remainder = sum % 11;
		const expected = remainder < 2 ? 0 : 11 - remainder;

		if (expected !== Number(digits[length])) {
			return false;
		}
	}

	return true;
}
