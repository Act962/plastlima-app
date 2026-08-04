import { draftMode } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

/** Desliga o modo rascunho e volta para a home (ou o `path` informado). */
export async function GET(request: NextRequest): Promise<NextResponse> {
	const rawPath = request.nextUrl.searchParams.get("path") ?? "/";
	const path =
		rawPath.startsWith("/") && !rawPath.startsWith("//") ? rawPath : "/";

	(await draftMode()).disable();

	return NextResponse.redirect(new URL(path, request.url));
}
