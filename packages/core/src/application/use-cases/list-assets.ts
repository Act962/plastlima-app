import type { MediaAsset } from "../../domain/media/entities/media-asset";
import type { MediaRepository } from "../../domain/media/repositories/media-repository";

/** Lista os arquivos de mídia, do mais recente para o mais antigo. */
export class ListAssets {
	constructor(private readonly media: MediaRepository) {}

	execute(): Promise<MediaAsset[]> {
		return this.media.list();
	}
}
