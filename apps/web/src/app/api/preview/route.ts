import { verifyPreviewToken } from "@plastlima-app/infra";
import { draftMode } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Ativa o modo rascunho e redireciona para a página pedida (spec §7.4).
 *
 * Chamada pelo painel com um token assinado de vida curta. Válido o token,
 * liga-se o draft mode (cookie httpOnly) e as funções de `lib/content` passam a
 * ler o rascunho. O `path` é validado como caminho interno para o preview não
 * virar um redirecionador aberto.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
	const secret = process.env.PREVIEW_SECRET;
	const token = request.nextUrl.searchParams.get("token");
	const rawPath = request.nextUrl.searchParams.get("path") ?? "/";

	if (
		!secret ||
		token === null ||
		!verifyPreviewToken(secret, token, Date.now())
	) {
		return NextResponse.json({ error: "não autorizado" }, { status: 401 });
	}

	// Só caminhos internos: começa com "/" e não com "//" (que seria outro host).
	const path =
		rawPath.startsWith("/") && !rawPath.startsWith("//") ? rawPath : "/";

	(await draftMode()).enable();

	return NextResponse.redirect(new URL(path, request.url));
}
