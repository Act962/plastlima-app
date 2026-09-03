"use client";

import { Separator } from "@plastlima-app/ui/components/separator";
import { SidebarTrigger } from "@plastlima-app/ui/components/sidebar";
import { usePathname } from "next/navigation";
import { activeNavItem } from "./nav-items";

/** Barra fixa do topo: gatilho da sidebar + trilha da seção atual. */
export function PanelTopbar() {
	const pathname = usePathname();
	const current = activeNavItem(pathname);

	return (
		<header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
			<SidebarTrigger className="-ml-1.5" />
			<Separator className="!h-4 !self-center mr-1" orientation="vertical" />
			<nav aria-label="Trilha" className="flex items-center gap-2 text-sm">
				<span className="text-muted-foreground">Painel</span>
				{current ? (
					<>
						<span className="text-muted-foreground/50">/</span>
						<span className="font-medium">{current.label}</span>
					</>
				) : null}
			</nav>
		</header>
	);
}
