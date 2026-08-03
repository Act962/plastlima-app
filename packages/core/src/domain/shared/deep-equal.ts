import type { JsonValue } from "./json";

/**
 * Igualdade estrutural entre dois valores JSON, independente da ordem das
 * chaves dos objetos.
 *
 * É o que sustenta a invariante 9 ("publicar sem alteração é rejeitado"): o
 * `draft` e o `published` são comparados por conteúdo, não por referência nem
 * por `JSON.stringify` — que consideraria `{a,b}` diferente de `{b,a}` e
 * dispararia revisões vazias sempre que a ordem das chaves mudasse na
 * serialização.
 */
export function deepEqual(a: JsonValue, b: JsonValue): boolean {
	if (a === b) {
		return true;
	}

	if (a === null || b === null) {
		return false;
	}

	if (Array.isArray(a) || Array.isArray(b)) {
		if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
			return false;
		}

		return a.every((item, index) => deepEqual(item, b[index] as JsonValue));
	}

	if (typeof a === "object" && typeof b === "object") {
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);

		if (keysA.length !== keysB.length) {
			return false;
		}

		return keysA.every(
			(key) =>
				Object.hasOwn(b, key) &&
				deepEqual(a[key] as JsonValue, b[key] as JsonValue),
		);
	}

	return false;
}
