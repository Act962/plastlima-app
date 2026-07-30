import type { ExternalLink } from "@/types/navigation";
import { DOCUMENTS, IMAGES } from "./images";

export const SITE = {
	name: "Plastlima",
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

export const SOCIAL_LINKS: ExternalLink[] = [
	{
		label: "Facebook",
		href: "https://www.facebook.com/profile.php?id=100076293463203&mibextid=LQQJ4d",
	},
	{ label: "Instagram", href: "https://www.instagram.com/plast.lima" },
	{ label: "Whatsapp", href: "https://wa.me/5586995548646" },
];
