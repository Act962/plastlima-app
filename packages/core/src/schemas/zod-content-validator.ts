import type { ContentValidator } from "../application/ports/content-validator";
import {
	type ContentIssue,
	InvalidContentError,
} from "../domain/content/errors";
import type { ContentKey } from "../domain/content/value-objects/content-key";
import type { JsonValue } from "../domain/shared/json";
import { fail, ok, type Result } from "../domain/shared/result";
import { getContentSchema } from "./content";

/**
 * Implementação da porta `ContentValidator` sobre o registro de schemas Zod.
 *
 * Vive no core porque os schemas são do core — é um adaptador do próprio domínio
 * para a sua própria porta, sem tocar em nenhuma infraestrutura externa.
 */
export class ZodContentValidator implements ContentValidator {
	validate(
		key: ContentKey,
		data: JsonValue,
	): Result<JsonValue, InvalidContentError> {
		const entry = this.entryFor(key);
		const result = entry.schema.safeParse(data);

		if (!result.success) {
			const issues: ContentIssue[] = result.error.issues.map((issue) => ({
				path: issue.path.join("."),
				message: issue.message,
			}));

			return fail(new InvalidContentError(key.value, issues));
		}

		return ok(result.data as JsonValue);
	}

	schemaVersion(key: ContentKey): number {
		return this.entryFor(key).version;
	}

	private entryFor(key: ContentKey) {
		const entry = getContentSchema(key.value);

		if (entry === undefined) {
			// Programador tentando publicar uma `key` ainda sem schema modelado —
			// não é erro de usuário, então quebra em vez de virar `Result`.
			throw new Error(`Schema de conteúdo não registrado para '${key.value}'`);
		}

		return entry;
	}
}
