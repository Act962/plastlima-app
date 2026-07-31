import { fail, ok, type Result } from "../../shared/result";
import { InvalidPhoneError } from "../errors";

/**
 * DDDs em uso no Brasil. A lista é fechada de propósito: o telefone é a chave de
 * deduplicação da campanha, então aceitar um DDD inexistente significa aceitar
 * dois cadastros da mesma pessoa com números diferentes.
 */
const VALID_AREA_CODES = new Set([
	"11",
	"12",
	"13",
	"14",
	"15",
	"16",
	"17",
	"18",
	"19",
	"21",
	"22",
	"24",
	"27",
	"28",
	"31",
	"32",
	"33",
	"34",
	"35",
	"37",
	"38",
	"41",
	"42",
	"43",
	"44",
	"45",
	"46",
	"47",
	"48",
	"49",
	"51",
	"53",
	"54",
	"55",
	"61",
	"62",
	"63",
	"64",
	"65",
	"66",
	"67",
	"68",
	"69",
	"71",
	"73",
	"74",
	"75",
	"77",
	"79",
	"81",
	"82",
	"83",
	"84",
	"85",
	"86",
	"87",
	"88",
	"89",
	"91",
	"92",
	"93",
	"94",
	"95",
	"96",
	"97",
	"98",
	"99",
]);

const BRAZIL_COUNTRY_CODE = "55";

/**
 * Telefone brasileiro normalizado.
 *
 * É o value object central da campanha: a regra "uma pessoa se cadastra uma vez"
 * depende inteiramente de `(86) 98897-0955`, `86988970955` e `+55 86 98897-0955`
 * colapsarem no mesmo `value`. Por isso a normalização mora no domínio, e não
 * numa função utilitária de formatação.
 */
export class PhoneNumber {
	private constructor(
		/** Formato E.164 sem o `+` — ex.: `5586988970955`. Chave de deduplicação. */
		readonly value: string,
		/** Formato legível para a equipe — ex.: `(86) 98897-0955`. */
		readonly display: string,
	) {}

	static create(raw: string): Result<PhoneNumber, InvalidPhoneError> {
		const digits = raw.replace(/\D/g, "");

		if (digits.length === 0) {
			return fail(new InvalidPhoneError("informe o número"));
		}

		const national = stripCountryCode(digits);

		if (national === null) {
			return fail(new InvalidPhoneError("código de país não reconhecido"));
		}

		if (national.length !== 10 && national.length !== 11) {
			return fail(
				new InvalidPhoneError("informe DDD e número, com 10 ou 11 dígitos"),
			);
		}

		const areaCode = national.slice(0, 2);

		if (!VALID_AREA_CODES.has(areaCode)) {
			return fail(new InvalidPhoneError(`DDD ${areaCode} não existe`));
		}

		const subscriber = national.slice(2);

		// Celular no Brasil tem 9 dígitos e começa com 9 desde 2016.
		if (subscriber.length === 9 && !subscriber.startsWith("9")) {
			return fail(new InvalidPhoneError("celular deve começar com 9"));
		}

		// Fixo tem 8 dígitos e começa entre 2 e 5.
		if (subscriber.length === 8 && !/^[2-5]/.test(subscriber)) {
			return fail(new InvalidPhoneError("número fixo inválido"));
		}

		return ok(
			new PhoneNumber(
				`${BRAZIL_COUNTRY_CODE}${national}`,
				formatNational(areaCode, subscriber),
			),
		);
	}

	/** Atalho para validação em schema, quando o valor normalizado não interessa. */
	static isValid(raw: string): boolean {
		return PhoneNumber.create(raw).ok;
	}

	/**
	 * Reconstitui a partir de um valor já persistido.
	 *
	 * Diferente de `create`, lança em vez de retornar `Result`: entrada de usuário
	 * inválida é esperada e vira mensagem de erro, mas um telefone inválido vindo
	 * do nosso próprio banco significa dado corrompido, que é excepcional.
	 */
	static restore(e164: string): PhoneNumber {
		const result = PhoneNumber.create(e164);

		if (!result.ok) {
			throw new Error(`Telefone persistido em formato inválido: ${e164}`);
		}

		return result.value;
	}

	/**
	 * Máscara progressiva para o campo de digitação. Aceita entrada parcial e
	 * nunca lança — a validação de verdade é `create`.
	 */
	static mask(raw: string): string {
		const typed = raw.replace(/\D/g, "");

		// Quem cola um número internacional traz o "55" na frente. Sem descartá-lo,
		// o corte em 11 dígitos transformaria +55 86 98897-0955 em (55) 86988-9709.
		// O limiar é > 11 porque 55 também é um DDD válido (Santa Maria, RS).
		const digits = (
			typed.length > 11 && typed.startsWith(BRAZIL_COUNTRY_CODE)
				? typed.slice(BRAZIL_COUNTRY_CODE.length)
				: typed
		).slice(0, 11);

		if (digits.length <= 2) {
			return digits;
		}

		const areaCode = digits.slice(0, 2);
		const subscriber = digits.slice(2);

		if (subscriber.length <= 4) {
			return `(${areaCode}) ${subscriber}`;
		}

		// Enquanto tem até 8 dígitos, quebra como fixo; no 9º, vira celular.
		const splitAt = subscriber.length <= 8 ? 4 : 5;

		return `(${areaCode}) ${subscriber.slice(0, splitAt)}-${subscriber.slice(splitAt)}`;
	}

	toString(): string {
		return this.value;
	}
}

/**
 * Remove o `55` inicial quando o número veio em formato internacional.
 * Retorna `null` quando o comprimento indica um país que não é o Brasil.
 */
function stripCountryCode(digits: string): string | null {
	if (digits.length <= 11) {
		return digits;
	}

	if (digits.startsWith(BRAZIL_COUNTRY_CODE)) {
		return digits.slice(BRAZIL_COUNTRY_CODE.length);
	}

	return null;
}

function formatNational(areaCode: string, subscriber: string): string {
	const splitAt = subscriber.length === 9 ? 5 : 4;

	return `(${areaCode}) ${subscriber.slice(0, splitAt)}-${subscriber.slice(splitAt)}`;
}
