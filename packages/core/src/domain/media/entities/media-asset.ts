import { fail, ok, type Result } from "../../shared/result";
import { InvalidMediaError } from "../errors";

/** Estado serializável de um arquivo de mídia. */
export type MediaAssetSnapshot = {
	/** `null` enquanto não persistido; o id do banco depois de salvo. */
	id: string | null;
	storageKey: string;
	url: string;
	alt: string;
	width: number;
	height: number;
	bytes: number;
	mimeType: string;
	checksum: string;
	createdBy: string;
	createdAt: Date;
};

export type CreateMediaAssetInput = {
	storageKey: string;
	url: string;
	alt: string;
	width: number;
	height: number;
	bytes: number;
	mimeType: string;
	checksum: string;
	createdBy: string;
	now: Date;
};

/**
 * Um arquivo de mídia enviado pelo painel. Regra de negócio aqui: `alt` é
 * obrigatório (invariante 7) e as medidas precisam ser positivas. A validação de
 * tipo/magic bytes/tamanho acontece antes, na análise do arquivo (infra).
 */
export class MediaAsset {
	private constructor(private readonly props: MediaAssetSnapshot) {}

	static create(
		input: CreateMediaAssetInput,
	): Result<MediaAsset, InvalidMediaError> {
		if (input.alt.trim() === "") {
			return fail(new InvalidMediaError("O texto alternativo é obrigatório."));
		}

		if (input.width <= 0 || input.height <= 0) {
			return fail(
				new InvalidMediaError("As dimensões da imagem são inválidas."),
			);
		}

		if (input.bytes <= 0) {
			return fail(new InvalidMediaError("O arquivo está vazio."));
		}

		return ok(
			new MediaAsset({
				id: null,
				storageKey: input.storageKey,
				url: input.url,
				alt: input.alt.trim(),
				width: input.width,
				height: input.height,
				bytes: input.bytes,
				mimeType: input.mimeType,
				checksum: input.checksum,
				createdBy: input.createdBy,
				createdAt: input.now,
			}),
		);
	}

	static restore(snapshot: MediaAssetSnapshot): MediaAsset {
		return new MediaAsset(snapshot);
	}

	get storageKey(): string {
		return this.props.storageKey;
	}

	get checksum(): string {
		return this.props.checksum;
	}

	toSnapshot(): MediaAssetSnapshot {
		return { ...this.props };
	}
}
