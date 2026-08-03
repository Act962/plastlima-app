import { fail, ok, type Result } from "../../shared/result";
import { UnknownContentKeyError } from "../errors";

/**
 * As chaves de conteúdo editáveis pelo CMS — uma por página/área do site.
 *
 * A lista é fechada e espelha a estrutura fixa do site: o CMS troca o conteúdo
 * dentro dessas posições, mas nunca cria uma nova. Um `key` fora dessa lista é
 * dado forjado, não conteúdo novo.
 */
export const CONTENT_KEYS = [
	"home",
	"about",
	"franchise",
	"locations",
	"privacy-policy",
	"site",
	"navigation",
] as const;

export type ContentKeyValue = (typeof CONTENT_KEYS)[number];

/**
 * Identificador de um documento de conteúdo.
 *
 * Existe como value object porque "ser uma key conhecida" é uma invariante: o
 * caso de uso não deve conseguir carregar nem publicar um documento cuja chave
 * não corresponde a uma área real do site.
 */
export class ContentKey {
	private constructor(readonly value: ContentKeyValue) {}

	static create(raw: string): Result<ContentKey, UnknownContentKeyError> {
		if (!ContentKey.isValid(raw)) {
			return fail(new UnknownContentKeyError(raw));
		}

		return ok(new ContentKey(raw));
	}

	/** Reconstitui uma key vinda do próprio banco, onde já se sabe que é válida. */
	static restore(value: ContentKeyValue): ContentKey {
		return new ContentKey(value);
	}

	static isValid(raw: string): raw is ContentKeyValue {
		return (CONTENT_KEYS as readonly string[]).includes(raw);
	}

	equals(other: ContentKey): boolean {
		return this.value === other.value;
	}

	toString(): string {
		return this.value;
	}
}
