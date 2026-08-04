"use client";

import { cn } from "@plastlima-app/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
	FileText,
	Home,
	Image as ImageIcon,
	Inbox,
	Info,
	MapPin,
	Navigation,
	Settings,
	Store,
	Ticket,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * O menu espelha as páginas do site, não as tabelas do banco (spec §6.1): quem
 * usa o painel pensa "quero mudar o banner da home", não "update no documento
 * key=home".
 *
 * Os documentos vão sendo ligados um a um na Fase 5. Itens prontos são links
 * (`href` tipado como `Route`, validado pelo `typedRoutes`); os pendentes são
 * rótulos "em breve", sem rota.
 */
type ReadyItem = { label: string; href: Route; icon: LucideIcon };
type SoonItem = { label: string; icon: LucideIcon };
type NavItem = ReadyItem | SoonItem;

function isReady(item: NavItem): item is ReadyItem {
	return "href" in item;
}

const CONTENT_ITEMS: NavItem[] = [
	{ label: "Início", href: "/inicio", icon: Home },
	{ label: "Sobre", href: "/sobre", icon: Info },
	{ label: "Franquias", href: "/franquias", icon: Store },
	{ label: "Unidades", href: "/unidades", icon: MapPin },
	{
		label: "Política de Privacidade",
		href: "/politica-de-privacidade",
		icon: FileText,
	},
];

const SYSTEM_ITEMS: NavItem[] = [
	{ label: "Configurações", href: "/config", icon: Settings },
	{ label: "Navegação", href: "/navegacao", icon: Navigation },
	{ label: "Mídia", icon: ImageIcon },
	{ label: "Leads", icon: Inbox },
	{ label: "Participantes", href: "/participantes", icon: Ticket },
];

export function SidebarNav() {
	const pathname = usePathname();

	return (
		<nav aria-label="Seções do painel" className="flex flex-col gap-6">
			<Section items={CONTENT_ITEMS} pathname={pathname} title="Conteúdo" />
			<Section items={SYSTEM_ITEMS} pathname={pathname} title="Sistema" />
		</nav>
	);
}

function Section({
	title,
	items,
	pathname,
}: {
	title: string;
	items: NavItem[];
	pathname: string;
}) {
	return (
		<div className="flex flex-col gap-1">
			<p className="px-3 pb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
				{title}
			</p>
			{items.map((item) =>
				isReady(item) ? (
					<ReadyLink item={item} key={item.label} pathname={pathname} />
				) : (
					<SoonLink item={item} key={item.label} />
				),
			)}
		</div>
	);
}

function ReadyLink({ item, pathname }: { item: ReadyItem; pathname: string }) {
	const Icon = item.icon;
	const isActive = pathname.startsWith(item.href);

	return (
		<Link
			aria-current={isActive ? "page" : undefined}
			className={cn(
				"flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-sm transition-colors",
				isActive ? "bg-brand/10 text-brand" : "text-foreground hover:bg-muted",
			)}
			href={item.href}
		>
			<Icon aria-hidden className="size-4 shrink-0" />
			{item.label}
		</Link>
	);
}

function SoonLink({ item }: { item: SoonItem }) {
	const Icon = item.icon;

	return (
		<span
			className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground/60 text-sm"
			title="Em breve"
		>
			<Icon aria-hidden className="size-4 shrink-0" />
			{item.label}
			<span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
				em breve
			</span>
		</span>
	);
}
