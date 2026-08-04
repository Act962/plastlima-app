import { z } from "zod";

/**
 * Schema do documento `franchise` — o conteúdo da página "Seja um franqueado".
 *
 * Espelha as constantes de `apps/web/src/data/franchise.ts`: a trajetória
 * (timeline), os segmentos atendidos, os parágrafos "Sobre a Plastlima" e as
 * imagens de dados de mercado. Mantém o shape v1 exatamente como está hoje — os
 * parágrafos seguem texto simples (a migração para texto rico é a decisão em
 * aberto #1 da spec, feita por schemaVersion quando for a hora).
 *
 * O hero e o formulário da página têm texto fixo e ficam fora deste documento.
 */

const nonEmpty = (field: string) =>
	z.string().trim().min(1, `${field} é obrigatório.`);

/** Um marco da trajetória: o ano e o que aconteceu. */
export const timelineEntrySchema = z.object({
	year: nonEmpty("O ano"),
	description: nonEmpty("A descrição"),
});

/** Uma imagem de dados de mercado: caminho e texto alternativo. */
export const marketImageSchema = z.object({
	src: nonEmpty("A imagem"),
	alt: nonEmpty("O texto alternativo"),
});

export const franchiseContentSchema = z.object({
	timeline: z
		.array(timelineEntrySchema)
		.min(1, "A trajetória precisa de ao menos um marco."),
	segments: z
		.array(nonEmpty("O segmento"))
		.min(1, "Informe ao menos um segmento."),
	about: z
		.array(nonEmpty("O parágrafo"))
		.min(1, "O texto sobre a empresa não pode ficar vazio."),
	marketImages: z.array(marketImageSchema),
});

export type FranchiseContent = z.infer<typeof franchiseContentSchema>;
export type TimelineEntryContent = z.infer<typeof timelineEntrySchema>;
export type MarketImageContent = z.infer<typeof marketImageSchema>;
