export type CompressedImage = {
	dataUrl: string;
	/** Tamanho aproximado em bytes do JPEG resultante. */
	bytes: number;
	width: number;
	height: number;
};

/** Maior lado da imagem após a compressão. */
export const MAX_IMAGE_DIMENSION = 1200;

const JPEG_QUALITY = 0.7;

/**
 * Calcula as dimensões finais preservando a proporção.
 *
 * Imagens menores que o limite não são ampliadas — aumentar um cupom pequeno só
 * geraria um arquivo maior sem ganho de legibilidade.
 */
export function scaleToFit(
	width: number,
	height: number,
	maxDimension: number,
): { width: number; height: number } {
	const largestSide = Math.max(width, height);

	if (largestSide <= maxDimension) {
		return { width, height };
	}

	const ratio = maxDimension / largestSide;

	return {
		width: Math.max(1, Math.round(width * ratio)),
		height: Math.max(1, Math.round(height * ratio)),
	};
}

/** Estima o tamanho em bytes do conteúdo de um data URL base64. */
export function estimateDataUrlBytes(dataUrl: string): number {
	const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
	const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;

	return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

/**
 * Reduz a foto do cupom antes do envio.
 *
 * Foto de celular tem de 3 a 8 MB e cresce ~33% em base64 — o body de uma Server
 * Action tem 1 MB. Sem esta etapa o cadastro simplesmente falha no aparelho do
 * cliente. `imageOrientation: "from-image"` respeita o EXIF, senão fotos tiradas
 * na vertical chegam deitadas.
 */
export async function compressImage(
	file: File,
	maxDimension: number = MAX_IMAGE_DIMENSION,
): Promise<CompressedImage> {
	const bitmap = await createImageBitmap(file, {
		imageOrientation: "from-image",
	});

	try {
		const size = scaleToFit(bitmap.width, bitmap.height, maxDimension);
		const canvas = document.createElement("canvas");

		canvas.width = size.width;
		canvas.height = size.height;

		const context = canvas.getContext("2d");

		if (context === null) {
			throw new Error("Não foi possível processar a imagem neste navegador.");
		}

		// Fundo branco: JPEG não tem transparência, e sem isso um PNG com alfa
		// vira fundo preto.
		context.fillStyle = "#ffffff";
		context.fillRect(0, 0, size.width, size.height);
		context.drawImage(bitmap, 0, 0, size.width, size.height);

		const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

		return {
			dataUrl,
			bytes: estimateDataUrlBytes(dataUrl),
			width: size.width,
			height: size.height,
		};
	} finally {
		bitmap.close();
	}
}

/** Formata bytes para exibição curta, ex.: "182 KB". */
export function formatBytes(bytes: number): string {
	if (bytes < 1024) {
		return `${bytes} B`;
	}

	const kilobytes = bytes / 1024;

	if (kilobytes < 1024) {
		return `${Math.round(kilobytes)} KB`;
	}

	return `${(kilobytes / 1024).toFixed(1)} MB`;
}
