/**
 * Porta que invalida o cache do site público após uma publicação.
 *
 * O domínio só conhece a tag a invalidar (`content:home`, ...). Como admin e
 * site são deploys separados, a implementação (`HttpRevalidationClient` em
 * `packages/infra`) faz um `POST` autenticado para a rota de revalidação do
 * `apps/web`, que chama `revalidateTag`. O caso de uso invalida **por último**,
 * depois de persistir — invalidar antes serviria conteúdo velho.
 */
export interface CacheInvalidator {
	invalidate(tags: string[]): Promise<void>;
}

/** A tag de cache de um documento de conteúdo. */
export function contentCacheTag(key: string): string {
	return `content:${key}`;
}
