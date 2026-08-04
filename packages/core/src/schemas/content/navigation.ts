import { z } from "zod";

/**
 * Schema do documento `navigation` — os rótulos do menu.
 *
 * Decisão da spec §2.5: a estrutura do site não muda pelo CMS. Os `href` são
 * rotas fixas, tipadas em código (`apps/web/src/data/navigation.ts`); o
 * documento guarda apenas o `label` de cada item. O site nunca roteia com o
 * `href` vindo do banco — ele casa cada rota fixa com o rótulo salvo aqui. Assim
 * um editor troca o texto do menu sem poder quebrar a navegação.
 */

const nonEmpty = (field: string) =>
	z.string().trim().min(1, `${field} é obrigatório.`);

/** Um item do menu: a rota (referência) e o rótulo editável. */
export const navLinkSchema = z.object({
	href: nonEmpty("A rota"),
	label: nonEmpty("O rótulo"),
});

export const navigationContentSchema = z.object({
	/** Menu principal (cabeçalho e "links rápidos" do rodapé). */
	main: z.array(navLinkSchema),
	/** Rotas jurídicas exibidas no rodapé. */
	legal: z.array(navLinkSchema),
});

export type NavigationContent = z.infer<typeof navigationContentSchema>;
export type NavLinkContent = z.infer<typeof navLinkSchema>;
