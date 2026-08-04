import { z } from "zod";

/**
 * Schema do documento `about` (spec §8: ABOUT_STORY, ABOUT_SUMMARY,
 * WELCOME_MESSAGE).
 *
 * A história é uma lista de blocos: parágrafo (texto rico) ou imagem. O texto
 * rico segue o modelo do site — `RichTextSegment`: uma string simples ou um
 * trecho em negrito. É só isso: texto e ênfase (spec §6.4).
 */

const nonEmpty = (field: string) =>
	z.string().trim().min(1, `${field} é obrigatório.`);

/** Um trecho de texto: puro ou em negrito. Espelha o `RichTextSegment` do site. */
export const richTextSegmentSchema = z.union([
	z.string(),
	z.object({
		text: nonEmpty("O trecho em negrito"),
		emphasis: z.literal(true),
	}),
]);

const paragraphBlockSchema = z.object({
	id: nonEmpty("O id do bloco"),
	kind: z.literal("paragraph"),
	tone: z.literal("lead").optional(),
	segments: z
		.array(richTextSegmentSchema)
		.min(1, "O parágrafo não pode ficar vazio."),
});

const imageBlockSchema = z.object({
	id: nonEmpty("O id do bloco"),
	kind: z.literal("image"),
	src: nonEmpty("A imagem"),
	alt: nonEmpty("O texto alternativo"),
});

export const storyBlockSchema = z.discriminatedUnion("kind", [
	paragraphBlockSchema,
	imageBlockSchema,
]);

export const aboutContentSchema = z.object({
	story: z
		.array(storyBlockSchema)
		.min(1, "A história precisa de ao menos um bloco."),
	summary: nonEmpty("O resumo"),
	welcome: nonEmpty("A mensagem de boas-vindas"),
});

export type AboutContent = z.infer<typeof aboutContentSchema>;
export type AboutStoryBlock = z.infer<typeof storyBlockSchema>;
export type AboutRichTextSegment = z.infer<typeof richTextSegmentSchema>;
