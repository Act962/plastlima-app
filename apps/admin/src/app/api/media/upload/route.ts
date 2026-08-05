import { analyzeImage } from "@plastlima-app/infra";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createUploadAsset } from "@/lib/media";

/** Limite por arquivo: 5 MB. */
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Upload de mídia por rota (não por Server Action) para o cliente acompanhar o
 * progresso com XHR — e porque rotas não têm o teto de 1 MB das Server Actions.
 * A autenticação é checada aqui direto (sem redirect, para o XHR receber JSON).
 */
export async function POST(request: Request): Promise<Response> {
	const session = await auth.api.getSession({ headers: await headers() });

	if (session === null) {
		return NextResponse.json(
			{ ok: false, message: "Sessão expirada. Entre novamente." },
			{ status: 401 },
		);
	}

	const upload = createUploadAsset();

	if (upload === null) {
		return NextResponse.json(
			{
				ok: false,
				message: "Mídia indisponível: configure as variáveis R2_*.",
			},
			{ status: 503 },
		);
	}

	const form = await request.formData();
	const file = form.get("file");
	const alt = String(form.get("alt") ?? "");

	if (!(file instanceof File) || file.size === 0) {
		return NextResponse.json(
			{ ok: false, message: "Selecione um arquivo." },
			{ status: 400 },
		);
	}

	if (file.size > MAX_BYTES) {
		return NextResponse.json(
			{ ok: false, message: "Arquivo maior que 5 MB." },
			{ status: 413 },
		);
	}

	const bytes = new Uint8Array(await file.arrayBuffer());
	const analyzed = analyzeImage(bytes);

	if (!analyzed.ok) {
		return NextResponse.json(
			{ ok: false, message: analyzed.error.message },
			{ status: 400 },
		);
	}

	const result = await upload.execute({
		bytes,
		mimeType: analyzed.value.mimeType,
		width: analyzed.value.width,
		height: analyzed.value.height,
		byteLength: analyzed.value.byteLength,
		checksum: analyzed.value.checksum,
		alt: alt.trim() === "" ? file.name : alt,
		actor: { id: session.user.id, email: session.user.email },
	});

	if (!result.ok) {
		return NextResponse.json(
			{ ok: false, message: result.error.message },
			{ status: 400 },
		);
	}

	const snapshot = result.value.toSnapshot();

	return NextResponse.json({
		ok: true,
		asset: {
			id: snapshot.id ?? "",
			url: snapshot.url,
			alt: snapshot.alt,
			width: snapshot.width,
			height: snapshot.height,
			bytes: snapshot.bytes,
			mimeType: snapshot.mimeType,
			createdAt: snapshot.createdAt.toISOString(),
		},
	});
}
