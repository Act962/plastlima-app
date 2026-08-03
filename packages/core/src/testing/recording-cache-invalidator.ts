import type { CacheInvalidator } from "../application/ports/cache-invalidator";

/**
 * Dublê que registra as tags invalidadas, para o teste confirmar que a
 * publicação disparou a invalidação certa — e, com o contador, que ela veio
 * **depois** de persistir.
 */
export class RecordingCacheInvalidator implements CacheInvalidator {
	readonly invalidatedTags: string[][] = [];

	/** Gancho para o teste observar o estado no instante da invalidação. */
	onInvalidate: ((tags: string[]) => void) | null = null;

	async invalidate(tags: string[]): Promise<void> {
		this.onInvalidate?.(tags);
		this.invalidatedTags.push(tags);
	}

	get flatTags(): string[] {
		return this.invalidatedTags.flat();
	}
}
