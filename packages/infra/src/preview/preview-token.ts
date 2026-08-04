import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Token assinado e de vida curta para ativar o modo rascunho no site (spec §7.4).
 *
 * É um HMAC-SHA256 da expiração usando o `PREVIEW_SECRET` compartilhado: o painel
 * gera, o site verifica, e o segredo nunca trafega na URL. Sem estado no servidor
 * — a validade está no próprio token.
 *
 * Formato: `<expiraEmMs>.<assinaturaHex>`.
 */

const DEFAULT_TTL_MS = 5 * 60 * 1000;

function sign(secret: string, payload: string): string {
	return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Gera um token válido por `ttlMs` a partir de `now` (ms desde a epoch). */
export function createPreviewToken(
	secret: string,
	now: number,
	ttlMs: number = DEFAULT_TTL_MS,
): string {
	const expiresAt = now + ttlMs;
	return `${expiresAt}.${sign(secret, String(expiresAt))}`;
}

/** Verifica assinatura e validade. `now` em ms desde a epoch. */
export function verifyPreviewToken(
	secret: string,
	token: string,
	now: number,
): boolean {
	const separator = token.indexOf(".");

	if (separator === -1) {
		return false;
	}

	const expiresAtRaw = token.slice(0, separator);
	const signature = token.slice(separator + 1);
	const expiresAt = Number(expiresAtRaw);

	if (!Number.isFinite(expiresAt) || expiresAt < now) {
		return false;
	}

	const expected = sign(secret, expiresAtRaw);
	const given = Buffer.from(signature, "hex");
	const wanted = Buffer.from(expected, "hex");

	// Comparação de tempo constante — e só depois de garantir tamanhos iguais,
	// que `timingSafeEqual` exige.
	return given.length === wanted.length && timingSafeEqual(given, wanted);
}
