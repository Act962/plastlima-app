"use server";

import type { MediaAsset } from "@plastlima-app/core";
import { analyzeImage } from "@plastlima-app/infra";
import { requireActor } from "@/lib/auth-actor";
import {
	createDeleteAsset,
	createListAssets,
	createUploadAsset,
} from "@/lib/media";

/** Limite por arquivo: 5 MB. */
const MAX_BYTES = 5 * 1024 * 1024;

export type AssetSummary = {
	id: string;
	url: string;
	alt: string;
	width: number;
	height: number;
	bytes: number;
	mimeType: string;
	createdAt: string;
};

export type UploadResult =
	| { ok: true; asset: AssetSummary }
	| { ok: false; message: string };

export type DeleteResult = { ok: true } | { ok: false; message: string };

function toSummary(asset: MediaAsset): AssetSummary {
	const snapshot = asset.toSnapshot();
	return {
		id: snapshot.id ?? "",
		url: snapshot.url,
		alt: snapshot.alt,
		width: snapshot.width,
		height: snapshot.height,
		bytes: snapshot.bytes,
		mimeType: snapshot.mimeType,
		createdAt: snapshot.createdAt.toISOString(),
	};
}

/** Recebe um arquivo do formulário, valida e envia ao R2. */
export async function uploadAssetAction(
	formData: FormData,
): Promise<UploadResult> {
	const actor = await requireActor();

	const file = formData.get("file");
	const alt = String(formData.get("alt") ?? "");

	if (!(file instanceof File) || file.size === 0) {
		return { ok: false, message: "Selecione um arquivo." };
	}

	if (file.size > MAX_BYTES) {
		return { ok: false, message: "Arquivo maior que 5 MB." };
	}

	if (alt.trim() === "") {
		return { ok: false, message: "Descreva a imagem (texto alternativo)." };
	}

	const upload = createUploadAsset();

	if (upload === null) {
		return {
			ok: false,
			message: "Mídia indisponível: configure as variáveis R2_* no servidor.",
		};
	}

	const bytes = new Uint8Array(await file.arrayBuffer());
	const analyzed = analyzeImage(bytes);

	if (!analyzed.ok) {
		return { ok: false, message: analyzed.error.message };
	}

	const result = await upload.execute({
		bytes,
		mimeType: analyzed.value.mimeType,
		width: analyzed.value.width,
		height: analyzed.value.height,
		byteLength: analyzed.value.byteLength,
		checksum: analyzed.value.checksum,
		alt,
		actor,
	});

	if (!result.ok) {
		return { ok: false, message: result.error.message };
	}

	return { ok: true, asset: toSummary(result.value) };
}

/** Lista os arquivos, do mais recente para o mais antigo. */
export async function listAssetsAction(): Promise<AssetSummary[]> {
	await requireActor();

	const assets = await createListAssets().execute();
	return assets.map(toSummary);
}

/** Remove um arquivo do bucket e do banco. */
export async function deleteAssetAction(id: string): Promise<DeleteResult> {
	const actor = await requireActor();

	const remove = createDeleteAsset();

	if (remove === null) {
		return {
			ok: false,
			message: "Mídia indisponível: configure as variáveis R2_* no servidor.",
		};
	}

	const result = await remove.execute({ id, actor });

	if (!result.ok) {
		return { ok: false, message: "Essa mídia não existe mais." };
	}

	return { ok: true };
}
