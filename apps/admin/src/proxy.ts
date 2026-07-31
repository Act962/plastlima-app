import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Barreira otimista: só checa a presença do cookie, sem consultar o banco, para
 * não pagar uma query em toda navegação. A verificação real da sessão acontece
 * em cada página e rota protegida — esta camada existe apenas para redirecionar
 * cedo quem claramente não está logado.
 *
 * Chamava-se `middleware` até o Next 16, que renomeou a convenção para `proxy`.
 */
export function proxy(request: NextRequest) {
	const sessionCookie = getSessionCookie(request);

	if (sessionCookie === null) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/", "/participantes/:path*"],
};
