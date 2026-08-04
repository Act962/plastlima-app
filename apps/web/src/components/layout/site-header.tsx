"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LuMenu, LuX } from "react-icons/lu";
import { ExternalActionLink } from "@/components/ui/external-action-link";
import { EXTERNAL_LINKS, SITE } from "@/data/site";
import type { NavItem } from "@/types/navigation";
import { MobileMenu } from "./mobile-menu";
import { NavLink } from "./nav-link";

type SiteHeaderProps = {
	mainNav: NavItem[];
};

export function SiteHeader({ mainNav }: SiteHeaderProps) {
	const pathname = usePathname();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [menuPathname, setMenuPathname] = useState(pathname);

	// Any route change (including browser back/forward) closes the mobile menu.
	if (menuPathname !== pathname) {
		setMenuPathname(pathname);
		setIsMenuOpen(false);
	}

	return (
		<header className="sticky top-0 z-50 border-line border-b bg-surface/92 backdrop-blur-[12px]">
			<div className="mx-auto flex h-[78px] w-full max-w-site items-center gap-10 px-5 sm:px-8">
				<Link className="flex shrink-0 items-center" href="/">
					<Image
						alt={SITE.name}
						className="h-[42px] w-auto rounded-[10px]"
						height={1080}
						priority
						src={SITE.logoUrl}
						width={1080}
					/>
				</Link>

				<nav
					aria-label="Menu principal"
					className="ml-auto hidden items-center gap-1 min-[981px]:flex"
				>
					{mainNav.map((item) => (
						<NavLink
							isActive={pathname === item.href}
							item={item}
							key={item.href}
						/>
					))}
					<ExternalActionLink
						className="ml-3"
						href={EXTERNAL_LINKS.onlineCatalog}
						size="md"
						variant="outline"
					>
						Catálogo
					</ExternalActionLink>
				</nav>

				<button
					aria-controls="mobile-menu"
					aria-expanded={isMenuOpen}
					aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
					className="ml-auto inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-line-strong bg-surface text-ink transition-colors hover:border-ink min-[981px]:hidden"
					onClick={() => setIsMenuOpen((open) => !open)}
					type="button"
				>
					{isMenuOpen ? (
						<LuX className="size-5" />
					) : (
						<LuMenu className="size-5" />
					)}
				</button>
			</div>

			{isMenuOpen ? (
				<div className="min-[981px]:hidden">
					<MobileMenu
						activePath={pathname}
						items={mainNav}
						onNavigate={() => setIsMenuOpen(false)}
					/>
				</div>
			) : null}
		</header>
	);
}
