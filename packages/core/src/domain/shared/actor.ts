/**
 * Quem realizou uma ação de escrita no painel.
 *
 * É a forma mínima que o domínio precisa da identidade: `id` e `email` para o
 * registro de auditoria e para `updatedBy` / `publishedBy`. O `User` de verdade
 * é modelado pelo Better Auth, fora do domínio — o app resolve a sessão e passa
 * este valor ao caso de uso (camada anticorrupção da porta `AuthenticatedActor`
 * descrita no spec).
 */
export type Actor = {
	id: string;
	email: string;
};
