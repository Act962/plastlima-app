import { MediaAsset } from "../../domain/media/entities/media-asset";
import type { InvalidMediaError } from "../../domain/media/errors";
import type { MediaRepository } from "../../domain/media/repositories/media-repository";
import type { Actor } from "../../domain/shared/actor";
import { ok, type Result } from "../../domain/shared/result";
import type { AuditLogger } from "../ports/audit-logger";
import type { Clock } from "../ports/clock";
import type { StorageProvider } from "../ports/storage-provider";

const EXT_BY_MIME: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
	"image/avif": "avif",
};

export type UploadAssetInput = {
	bytes: Uint8Array;
	mimeType: string;
	width: number;
	height: number;
	byteLength: number;
	/** SHA-256 do conteúdo — chave de deduplicação e base do nome no bucket. */
	checksum: string;
	alt: string;
	actor: Actor;
};

/**
 * Envia um arquivo de mídia. Deduplicação por checksum (invariante 5): reenviar
 * o mesmo arquivo devolve o registro existente, sem gravar de novo. O nome no
 * bucket vem do checksum, nunca do nome original (spec §10.2).
 */
export class UploadAsset {
	constructor(
		private readonly media: MediaRepository,
		private readonly storage: StorageProvider,
		private readonly audit: AuditLogger,
		private readonly clock: Clock,
	) {}

	async execute(
		input: UploadAssetInput,
	): Promise<Result<MediaAsset, InvalidMediaError>> {
		const existing = await this.media.findByChecksum(input.checksum);

		if (existing !== null) {
			return ok(existing);
		}

		const ext = EXT_BY_MIME[input.mimeType] ?? "bin";
		const storageKey = `media/${input.checksum}.${ext}`;
		const url = await this.storage.put(storageKey, input.bytes, input.mimeType);

		const created = MediaAsset.create({
			storageKey,
			url,
			alt: input.alt,
			width: input.width,
			height: input.height,
			bytes: input.byteLength,
			mimeType: input.mimeType,
			checksum: input.checksum,
			createdBy: input.actor.email,
			now: this.clock.now(),
		});

		if (!created.ok) {
			return created;
		}

		const saved = await this.media.save(created.value);

		await this.audit.record({
			actor: input.actor,
			action: "media.upload",
			entityType: "MediaAsset",
			entityId: saved.toSnapshot().id ?? storageKey,
		});

		return ok(saved);
	}
}
