import type { SocialLink } from "@/types/navigation";
import { DOCUMENTS, IMAGES } from "./images";

/**
 * Origem pública do site (sem barra final). Usada em canonical, OpenGraph,
 * sitemap, robots e JSON-LD. Configurável por ambiente via NEXT_PUBLIC_SITE_URL
 * (ex.: domínio próprio em produção); o padrão é a URL atual na Vercel.
 */
export const SITE_URL = (
	process.env.NEXT_PUBLIC_SITE_URL ?? "https://plastlima-app-web.vercel.app"
).replace(/\/$/, "");

export const SITE = {
	name: "Plastlima",
	url: SITE_URL,
	description:
		"Distribuidora de descartáveis e embalagens com mais de 1.500 produtos, atendendo Piauí, Maranhão e Pernambuco desde 2002.",
	tagline:
		"Há mais de 23 anos oferecendo as melhores soluções em descartáveis.",
	logoUrl: IMAGES.logo,
	address: "Av. Henrry Wall de Carvalho — Angelim, Teresina - PI, 64034-280",
	email: "atendimento@plastlima.com.br",
	franchiseEmail: "franquias@plastlima.com.br",
	copyright: "Copyright © 2025 Plastlima. Todos os direitos reservados.",
} as const;

export const CONTACT = {
	support: { phone: "5586995548646", display: "86 99554-8646" },
	franchise: { phone: "5586981198729", display: "86 9 8119-8729" },
} as const;

export const EXTERNAL_LINKS = {
	onlineCatalog: "https://donodopreco.com.br",
	catalogPdf: DOCUMENTS.catalogPdf,
	headquartersMap:
		"https://maps.google.com/maps?q=Plastlima-Centro%20de%20Distribui%C3%A7%C3%A3o&t=m&z=16&output=embed&iwloc=near",
} as const;

export const SOCIAL_LINKS: SocialLink[] = [
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
];
