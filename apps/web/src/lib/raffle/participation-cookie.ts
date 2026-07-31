import { cookies } from "next/headers";

/**
 * Ponte entre a Server Action e a tela de confirmação.
 *
 * O redirect não carrega payload, e o número de participações não vale uma
 * query string: ela fica no histórico, é compartilhável e qualquer um edita.
 * Um cookie httpOnly de vida curta resolve — expira sozinho em poucos minutos,
 * então quem abre a confirmação por fora vê a versão neutra da tela.
 */
const COOKIE_NAME = "plastlima_sorteio_participacoes";
const MAX_AGE_SECONDS = 300;

export async function rememberParticipationCount(count: number): Promise<void> {
	const jar = await cookies();

	jar.set(COOKIE_NAME, String(count), {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/sorteio",
		maxAge: MAX_AGE_SECONDS,
	});
}

/** `null` quando não há cookie válido — trata-se a visita como primeira vez. */
export async function readParticipationCount(): Promise<number | null> {
	const jar = await cookies();
	const raw = jar.get(COOKIE_NAME)?.value;

	if (raw === undefined) {
		return null;
	}

	const count = Number.parseInt(raw, 10);

	return Number.isInteger(count) && count > 0 ? count : null;
}
