import type { InvalidContentError } from "../../domain/content/errors";
import type { ContentKey } from "../../domain/content/value-objects/content-key";
import type { JsonValue } from "../../domain/shared/json";
import type { Result } from "../../domain/shared/result";

/**
 * Porta que valida o conteúdo contra o formato esperado da sua `key`.
 *
 * É o que torna a invariante 1 ("publicar exige que o draft passe no schema
 * Zod") testável e desacoplada: o caso de uso `PublishDocument` depende deste
 * contrato, não de Zod diretamente. A implementação real (`ZodContentValidator`)
 * usa o registro de schemas do core; o número da versão de schema também vem
 * daqui, para gravar na revisão.
 */
export interface ContentValidator {
	validate(
		key: ContentKey,
		data: JsonValue,
	): Result<JsonValue, InvalidContentError>;

	/** Versão de formato atual da `key`, gravada em cada revisão. */
	schemaVersion(key: ContentKey): number;
}
