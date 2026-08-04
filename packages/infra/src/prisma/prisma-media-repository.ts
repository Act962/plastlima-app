import type { MediaAsset, MediaRepository } from "@plastlima-app/core";
import type { PrismaClient } from "@prisma/client";
import { toDomainAsset } from "./media-mapper";

export class PrismaMediaRepository implements MediaRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findByChecksum(checksum: string): Promise<MediaAsset | null> {
		const record = await this.prisma.mediaAsset.findUnique({
			where: { checksum },
		});

		return record === null ? null : toDomainAsset(record);
	}

	async findById(id: string): Promise<MediaAsset | null> {
		const record = await this.prisma.mediaAsset.findUnique({ where: { id } });

		return record === null ? null : toDomainAsset(record);
	}

	async save(asset: MediaAsset): Promise<MediaAsset> {
		const snapshot = asset.toSnapshot();

		const record = await this.prisma.mediaAsset.create({
			data: {
				storageKey: snapshot.storageKey,
				url: snapshot.url,
				alt: snapshot.alt,
				width: snapshot.width,
				height: snapshot.height,
				bytes: snapshot.bytes,
				mimeType: snapshot.mimeType,
				checksum: snapshot.checksum,
				createdBy: snapshot.createdBy,
				createdAt: snapshot.createdAt,
			},
		});

		return toDomainAsset(record);
	}

	async list(): Promise<MediaAsset[]> {
		const records = await this.prisma.mediaAsset.findMany({
			orderBy: { createdAt: "desc" },
		});

		return records.map(toDomainAsset);
	}

	async delete(id: string): Promise<void> {
		await this.prisma.mediaAsset.delete({ where: { id } });
	}
}
