import {
	FileText,
	Home,
	Image as ImageIcon,
	Inbox,
	Info,
	type LucideIcon,
	MapPin,
	Navigation,
	Settings,
	Store,
	Ticket,
	Trophy,
} from "lucide-react";
import type { Route } from "next";

export type NavItem = { label: string; href: Route; icon: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };

/**
 * O menu espelha as páginas do site, não as tabelas do banco: quem usa o painel
 * pensa "quero mudar o banner da home", não "update no documento key=home".
 *
 * Fonte única, consumida pela barra lateral e pela trilha do topo — assim o
 * rótulo de uma seção nunca diverge entre os dois.
 */
export const NAV_GROUPS: NavGroup[] = [
	{
		label: "Conteúdo",
		items: [
			{ label: "Início", href: "/inicio", icon: Home },
			{ label: "Sobre", href: "/sobre", icon: Info },
			{ label: "Franquias", href: "/franquias", icon: Store },
			{ label: "Unidades", href: "/unidades", icon: MapPin },
			{
				label: "Política de Privacidade",
				href: "/politica-de-privacidade",
				icon: FileText,
			},
		],
	},
	{
		label: "Sistema",
		items: [
			{ label: "Configurações", href: "/config", icon: Settings },
			{ label: "Navegação", href: "/navegacao", icon: Navigation },
			{ label: "Mídia", href: "/midia", icon: ImageIcon },
			{ label: "Leads", href: "/leads", icon: Inbox },
			{ label: "Participantes", href: "/participantes", icon: Ticket },
			{ label: "Sorteio", href: "/sorteio", icon: Trophy },
		],
	},
];

const ALL_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

/** O item de navegação cuja rota corresponde ao caminho atual, para a trilha e o destaque. */
export function activeNavItem(pathname: string): NavItem | undefined {
	return ALL_ITEMS.find(
		(item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
	);
}
