import { z } from "zod";

/**
 * Schema do documento `site` — os fatos globais da empresa que alimentam o
 * cabeçalho, o rodapé e os dados estruturados (spec §8: SITE, CONTACT,
 * EXTERNAL_LINKS, SOCIAL_LINKS).
 *
 * Fora daqui de propósito: `url` (é `NEXT_PUBLIC_SITE_URL`, variável de
 * ambiente) e o logo (vira `MediaAsset` na biblioteca de mídia). O que sobra é
 * texto e links que o cliente edita.
 */

const nonEmpty = (field: string) =>
	z.string().trim().min(1, `${field} é obrigatório.`);

const phoneSchema = z.object({
	/** E.164 sem o "+", ex.: 5586995548646 — usado no link do WhatsApp. */
	phone: nonEmpty("O telefone"),
	/** Formato legível, ex.: 86 99554-8646. */
	display: nonEmpty("O telefone formatado"),
});

const socialLinkSchema = z.object({
	/** Chave do ícone: facebook | instagram | whatsapp | … */
	platform: nonEmpty("A plataforma"),
	label: nonEmpty("O rótulo"),
	href: nonEmpty("O link").pipe(z.url("Informe uma URL válida.")),
});

export const siteContentSchema = z.object({
	name: nonEmpty("O nome"),
	tagline: nonEmpty("A chamada"),
	description: nonEmpty("A descrição"),
	address: nonEmpty("O endereço"),
	email: nonEmpty("O e-mail").pipe(z.email("Informe um e-mail válido.")),
	franchiseEmail: nonEmpty("O e-mail de franquias").pipe(
		z.email("Informe um e-mail válido."),
	),
	copyright: nonEmpty("O texto de copyright"),
	contact: z.object({
		support: phoneSchema,
		franchise: phoneSchema,
	}),
	externalLinks: z.object({
		onlineCatalog: nonEmpty("O catálogo online").pipe(
			z.url("Informe uma URL válida."),
		),
	}),
	social: z.array(socialLinkSchema),
});

export type SiteContent = z.infer<typeof siteContentSchema>;
export type SiteSocialLink = z.infer<typeof socialLinkSchema>;
