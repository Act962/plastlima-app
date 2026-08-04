import type { CacheInvalidator } from "@plastlima-app/core";

/**
 * Implementa a porta `CacheInvalidator` fazendo um `POST` autenticado para a
 * rota de revalidação do `apps/web` (spec §7.4). É o elo entre os dois deploys:
 * o admin publica, isto avisa o site.
 *
 * Uma falha aqui **não derruba a publicação** — o conteúdo já está persistido
 * quando este passo roda. Só registra o aviso; o `revalidate` do ISR no site é
 * a rede de segurança que renova o conteúdo mesmo sem esta chamada.
 */
export class HttpRevalidationClient implements CacheInvalidator {
	constructor(
		private readonly baseUrl: string,
		private readonly secret: string,
	) {}

	async invalidate(tags: string[]): Promise<void> {
		try {
			const response = await fetch(`${this.baseUrl}/api/revalidate`, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-revalidate-secret": this.secret,
				},
				body: JSON.stringify({ tags }),
			});

			if (!response.ok) {
				console.error(
					`[revalidate] site respondeu ${response.status} ao invalidar ${tags.join(", ")}`,
				);
			}
		} catch (error) {
			console.error("[revalidate] falha ao contatar o site", error);
		}
	}
}
