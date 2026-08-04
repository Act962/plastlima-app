import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import type { StorageProvider } from "@plastlima-app/core";

export type R2Config = {
	accountId: string;
	accessKeyId: string;
	secretAccessKey: string;
	bucket: string;
	/** Domínio público do bucket, ex.: https://cdn.plastlima.com. */
	publicUrl: string;
};

/**
 * Armazenamento no Cloudflare R2 via API S3-compatível. O R2 fica num domínio
 * separado do app (spec §10.2); `publicUrl` é esse domínio, e a URL pública de
 * cada objeto é `publicUrl/key`.
 */
export class R2StorageProvider implements StorageProvider {
	private readonly client: S3Client;
	private readonly bucket: string;
	private readonly publicUrl: string;

	constructor(config: R2Config) {
		this.bucket = config.bucket;
		this.publicUrl = config.publicUrl.replace(/\/$/, "");
		this.client = new S3Client({
			region: "auto",
			endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
		});
	}

	async put(
		key: string,
		bytes: Uint8Array,
		contentType: string,
	): Promise<string> {
		await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: bytes,
				ContentType: contentType,
			}),
		);

		return `${this.publicUrl}/${key}`;
	}

	async delete(key: string): Promise<void> {
		await this.client.send(
			new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
		);
	}
}

/**
 * Monta a config do R2 a partir do ambiente, ou `null` se algo faltar — o app
 * usa isso para avisar que a mídia está indisponível em vez de estourar.
 */
export function r2ConfigFromEnv(): R2Config | null {
	const accountId = process.env.R2_ACCOUNT_ID;
	const accessKeyId = process.env.R2_ACCESS_KEY_ID;
	const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
	const bucket = process.env.R2_BUCKET;
	const publicUrl = process.env.R2_PUBLIC_URL;

	if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
		return null;
	}

	return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}
