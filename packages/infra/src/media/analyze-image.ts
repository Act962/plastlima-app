import { createHash } from "node:crypto";
import { fail, ok, type Result } from "@plastlima-app/core";
import { imageSize } from "image-size";

export type AnalyzedImage = {
	mimeType: string;
	width: number;
	height: number;
	byteLength: number;
	/** SHA-256 do conteúdo, em hex. */
	checksum: string;
};

export type AnalyzeImageError = {
	reason: "unsupported" | "corrupt";
	message: string;
};

/** Tipo detectado pelo conteúdo (magic bytes) → MIME canônico aceito. */
const MIME_BY_TYPE: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	webp: "image/webp",
	avif: "image/avif",
};

/**
 * Analisa a imagem pelos bytes reais (spec §10.2): o tipo vem do conteúdo, não
 * do MIME declarado pelo cliente. Devolve o MIME canônico, as dimensões, o
 * tamanho e o checksum — tudo o que o `UploadAsset` precisa.
 */
export function analyzeImage(
	bytes: Uint8Array,
): Result<AnalyzedImage, AnalyzeImageError> {
	let dimensions: ReturnType<typeof imageSize>;

	try {
		dimensions = imageSize(bytes);
	} catch {
		return fail({
			reason: "corrupt",
			message: "Arquivo de imagem inválido ou corrompido.",
		});
	}

	const mimeType = dimensions.type ? MIME_BY_TYPE[dimensions.type] : undefined;

	if (mimeType === undefined) {
		return fail({
			reason: "unsupported",
			message: "Formato não suportado. Envie PNG, JPEG, WebP ou AVIF.",
		});
	}

	if (!dimensions.width || !dimensions.height) {
		return fail({
			reason: "corrupt",
			message: "Não foi possível ler as dimensões da imagem.",
		});
	}

	return ok({
		mimeType,
		width: dimensions.width,
		height: dimensions.height,
		byteLength: bytes.byteLength,
		checksum: createHash("sha256").update(bytes).digest("hex"),
	});
}
