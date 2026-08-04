import { MediaNotFoundError } from "../../domain/media/errors";
import type { MediaRepository } from "../../domain/media/repositories/media-repository";
import type { Actor } from "../../domain/shared/actor";
import { fail, ok, type Result } from "../../domain/shared/result";
import type { AuditLogger } from "../ports/audit-logger";
import type { StorageProvider } from "../ports/storage-provider";

export type DeleteAssetInput = {
	id: string;
	actor: Actor;
};

/** Remove um arquivo de mídia do bucket e do banco. */
export class DeleteAsset {
	constructor(
		private readonly media: MediaRepository,
		private readonly storage: StorageProvider,
		private readonly audit: AuditLogger,
	) {}

	async execute(
		input: DeleteAssetInput,
	): Promise<Result<null, MediaNotFoundError>> {
		const asset = await this.media.findById(input.id);

		if (asset === null) {
			return fail(new MediaNotFoundError(input.id));
		}

		await this.storage.delete(asset.storageKey);
		await this.media.delete(input.id);

		await this.audit.record({
			actor: input.actor,
			action: "media.delete",
			entityType: "MediaAsset",
			entityId: input.id,
		});

		return ok(null);
	}
}
