import { MediaAsset } from "@plastlima-app/core";
import type { MediaAsset as MediaAssetRecord } from "@prisma/client";

/** Registro do Prisma → entidade de domínio. */
export function toDomainAsset(record: MediaAssetRecord): MediaAsset {
	return MediaAsset.restore({
		id: record.id,
		storageKey: record.storageKey,
		url: record.url,
		alt: record.alt,
		width: record.width,
		height: record.height,
		bytes: record.bytes,
		mimeType: record.mimeType,
		checksum: record.checksum,
		createdBy: record.createdBy,
		createdAt: record.createdAt,
	});
}
