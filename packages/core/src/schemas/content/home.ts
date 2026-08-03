import { z } from "zod";

/**
 * Schema do documento `home` — a fonte da verdade do formato da página inicial.
 *
 * Espelha as constantes de `apps/web/src/data/home.ts` (`HERO_BANNERS`,
 * `COMPANY_STATS`, `OFFER_HIGHLIGHTS`) e passa a substituir os tipos em
 * `apps/web/src/types/content.ts`. Mantém o shape v1 exatamente como está hoje:
 * a evolução de formato (ex.: `fit` em `MediaItem`, decisão em aberto #2) é feita
 * por `schemaVersion` + migração, não editando este schema no lugar.
 */

const nonEmpty = (field: string) =>
	z.string().trim().min(1, `${field} é obrigatório.`);

/**
 * Uma imagem editorial: caminho, texto alternativo e destino opcional.
 *
 * `alt` é obrigatório e não vazio de propósito — sem ele não se publica (spec
 * §6.3): é acessibilidade e SEO dos quais o site já depende. `href` é uma string
 * porque vem do conteúdo; o app resolve a tipagem `Route` na fronteira.
 */
export const mediaItemSchema = z.object({
	src: nonEmpty("A imagem"),
	alt: nonEmpty("O texto alternativo"),
	href: z.string().trim().min(1).optional(),
});

export type MediaItemContent = z.infer<typeof mediaItemSchema>;

/** Arte alternativa para telas estreitas, com a proporção própria. */
const mobileArtSchema = z.object({
	src: nonEmpty("A imagem para celular"),
	aspect: z.number().positive("A proporção deve ser maior que zero."),
});

/** Banner do carrossel: imagem com proporção real e arte opcional para celular. */
export const heroBannerSchema = mediaItemSchema.extend({
	aspect: z
		.number()
		.positive("A proporção deve ser maior que zero.")
		.optional(),
	mobile: mobileArtSchema.optional(),
});

export type HeroBannerContent = z.infer<typeof heroBannerSchema>;

/** Número em destaque da empresa: valor e rótulo, ambos texto livre. */
export const statSchema = z.object({
	value: nonEmpty("O valor"),
	label: nonEmpty("O rótulo"),
});

export type StatContent = z.infer<typeof statSchema>;

export const homeContentSchema = z.object({
	banners: z
		.array(heroBannerSchema)
		.min(1, "A home precisa de ao menos um banner."),
	stats: z.array(statSchema),
	offers: z.array(mediaItemSchema),
});

export type HomeContent = z.infer<typeof homeContentSchema>;
