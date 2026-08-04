/**
 * Porta de armazenamento de arquivos (Cloudflare R2, S3-compatível).
 *
 * O caso de uso não sabe onde nem como o arquivo é guardado — em teste, um dublê
 * em memória cumpre o contrato. A implementação real vive em `packages/infra`.
 */
export interface StorageProvider {
	/**
	 * Envia os bytes sob a chave informada e devolve a URL pública. A chave é
	 * derivada do checksum (não do nome original), então reenviar o mesmo arquivo
	 * grava no mesmo lugar.
	 */
	put(key: string, bytes: Uint8Array, contentType: string): Promise<string>;

	/** Remove o objeto do bucket. */
	delete(key: string): Promise<void>;
}
