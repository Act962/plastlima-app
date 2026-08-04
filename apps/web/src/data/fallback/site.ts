import type { SiteContent } from "@plastlima-app/core/schemas";
import { CONTACT, EXTERNAL_LINKS, SITE, SOCIAL_LINKS } from "@/data/site";

/**
 * Configurações padrão do site — o que o rodapé/cabeçalho mostram quando o banco
 * está fora, o documento não existe ou o JSON não passa no schema (spec §7.1).
 *
 * É montado das mesmas constantes de sempre (`SITE`, `CONTACT`, …), menos o que
 * não é editável: `url` (variável de ambiente) e o logo (mídia).
 */
export const SITE_FALLBACK: SiteContent = {
	name: SITE.name,
	tagline: SITE.tagline,
	description: SITE.description,
	address: SITE.address,
	email: SITE.email,
	franchiseEmail: SITE.franchiseEmail,
	copyright: SITE.copyright,
	contact: {
		support: { ...CONTACT.support },
		franchise: { ...CONTACT.franchise },
	},
	externalLinks: { onlineCatalog: EXTERNAL_LINKS.onlineCatalog },
	social: SOCIAL_LINKS.map((link) => ({
		platform: link.platform,
		label: link.label,
		href: link.href,
	})),
};
