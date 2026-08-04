import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Invalidação de cache sob demanda, chamada pelo admin após publicar.
 *
 * Como admin e site são deploys separados, a publicação vira um `POST` aqui com
 * `{ tags: string[] }`; cada tag corresponde a um documento (`content:home`).
 * Autenticada por segredo compartilhado no header — sem ele, qualquer um
 * poderia forçar revalidações e derrubar o cache do site.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
	const secret = process.env.REVALIDATE_SECRET;

	// Sem segredo configurado, o endpoint fica fechado em vez de aberto: melhor
	// não revalidar do que aceitar qualquer chamada.
	if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
		return NextResponse.json({ error: "não autorizado" }, { status: 401 });
	}

	const body: unknown = await request.json().catch(() => null);
	const tags =
		body !== null && typeof body === "object" && "tags" in body
			? (body as { tags: unknown }).tags
			: null;

	if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) {
		return NextResponse.json(
			{ error: "corpo inválido: esperado { tags: string[] }" },
			{ status: 400 },
		);
	}

	// Next 16 exige o perfil de cache: "max" marca a tag como stale e serve o
	// conteúdo antigo enquanto revalida em segundo plano na próxima visita
	// (stale-while-revalidate), em vez de bloquear a requisição.
	for (const tag of tags as string[]) {
		revalidateTag(tag, "max");
	}

	return NextResponse.json({ revalidated: tags });
}
