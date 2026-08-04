import type { MediaAsset } from "../entities/media-asset";

/**
 * Porta de persistência de mídia. O domínio a declara; `packages/infra` a
 * implementa com Prisma.
 */
export interface MediaRepository {
	/** Registro com o mesmo checksum, se houver — base da deduplicação (inv. 5). */
	findByChecksum(checksum: string): Promise<MediaAsset | null>;

	/** Um arquivo pelo id (para excluir). */
	findById(id: string): Promise<MediaAsset | null>;

	/** Grava um novo arquivo e devolve o registro persistido (com id). */
	save(asset: MediaAsset): Promise<MediaAsset>;

	/** Todos os arquivos, do mais recente para o mais antigo. */
	list(): Promise<MediaAsset[]>;

	/** Remove o registro pelo id. A remoção no bucket é feita pelo caso de uso. */
	delete(id: string): Promise<void>;
}
