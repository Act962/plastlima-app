import type { SiteContent } from "@plastlima-app/core/schemas";

/**
 * Configurações iniciais do site, para o documento nascer preenchido no primeiro
 * acesso. Espelha `apps/web/src/data/site.ts` (temporário, como o HOME_SEED) —
 * a Fase 4/unificação de fallback é quem elimina essa duplicação.
 */
export const SITE_SEED: SiteContent = {
	name: "Plastlima",
	tagline:
		"Há mais de 23 anos oferecendo as melhores soluções em descartáveis.",
	description:
		"Distribuidora de descartáveis e embalagens com mais de 1.500 produtos, atendendo Piauí, Maranhão e Pernambuco desde 2002.",
	address: "Av. Henrry Wall de Carvalho — Angelim, Teresina - PI, 64034-280",
	email: "atendimento@plastlima.com.br",
	franchiseEmail: "franquias@plastlima.com.br",
	copyright: "Copyright © 2025 Plastlima. Todos os direitos reservados.",
	contact: {
		support: { phone: "5586995548646", display: "86 99554-8646" },
		franchise: { phone: "5586981198729", display: "86 9 8119-8729" },
	},
	externalLinks: { onlineCatalog: "https://donodopreco.com.br" },
	social: [
		{
			platform: "facebook",
			label: "Facebook",
			href: "https://www.facebook.com/profile.php?id=100076293463203&mibextid=LQQJ4d",
		},
		{
			platform: "instagram",
			label: "Instagram",
			href: "https://www.instagram.com/plastlima",
		},
		{
			platform: "whatsapp",
			label: "Whatsapp",
			href: "https://wa.me/5586995548646",
		},
	],
};
