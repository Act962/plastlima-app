import type { NavItem } from "@/types/navigation";

export const NAV_ITEMS: NavItem[] = [
	{ label: "Início", href: "/" },
	{ label: "Sobre nós", href: "/sobre" },
	{ label: "Unidades", href: "/unidades" },
	{ label: "Seja um franqueado", href: "/franquias" },
	{ label: "Contato", href: "/contato" },
];

/** Rotas jurídicas — exibidas no rodapé e incluídas no sitemap. */
export const LEGAL_ITEMS: NavItem[] = [
	{ label: "Política de Privacidade", href: "/politica-de-privacidade" },
];
