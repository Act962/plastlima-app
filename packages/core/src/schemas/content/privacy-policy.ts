import { z } from "zod";

/**
 * Schema do documento `privacy-policy` — a Política de Privacidade (spec §7.3).
 *
 * Espelha `apps/web/src/types/legal.ts` (`LegalDocument`). O texto usa tokens
 * como `{{site.email}}` em vez de valores fixos; a substituição acontece na
 * renderização, com os dados do documento `site` (ver `policy-tokens.ts`). Assim
 * mudar o e-mail nas Configurações reflete na política sem reeditá-la.
 */

const nonEmpty = (field: string) =>
	z.string().trim().min(1, `${field} é obrigatório.`);

const paragraphBlockSchema = z.object({
	type: z.literal("paragraph"),
	text: nonEmpty("O texto do parágrafo"),
});

const listBlockSchema = z.object({
	type: z.literal("list"),
	lead: z.string().trim().optional(),
	items: z
		.array(nonEmpty("O item"))
		.min(1, "A lista precisa de ao menos um item."),
});

export const policyBlockSchema = z.discriminatedUnion("type", [
	paragraphBlockSchema,
	listBlockSchema,
]);

export const policySectionSchema = z.object({
	id: nonEmpty("O id da seção"),
	title: nonEmpty("O título"),
	blocks: z
		.array(policyBlockSchema)
		.min(1, "A seção precisa de ao menos um bloco."),
});

export const privacyPolicyContentSchema = z.object({
	updatedAt: nonEmpty("A data de atualização"),
	intro: z
		.array(nonEmpty("O parágrafo"))
		.min(1, "A introdução não pode ficar vazia."),
	sections: z
		.array(policySectionSchema)
		.min(1, "A política precisa de ao menos uma seção."),
});

export type PrivacyPolicyContent = z.infer<typeof privacyPolicyContentSchema>;
export type PolicyBlockContent = z.infer<typeof policyBlockSchema>;
export type PolicySectionContent = z.infer<typeof policySectionSchema>;
