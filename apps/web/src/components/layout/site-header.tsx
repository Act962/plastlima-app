"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExternalActionLink } from "@/components/ui/external-action-link";
import { NAV_ITEMS } from "@/data/navigation";
import { EXTERNAL_LINKS, SITE } from "@/data/site";
import { MobileMenu } from "./mobile-menu";
import { NavLink } from "./nav-link";

export function SiteHeader() {
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
					{NAV_ITEMS.map((item) => (
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
					className="ml-auto inline-flex cursor-pointer items-center rounded-full border-[1.5px] border-line-strong bg-surface px-5 py-3 font-bold text-ink text-sm min-[981px]:hidden"
					onClick={() => setIsMenuOpen((open) => !open)}
					type="button"
				>
					{isMenuOpen ? "Fechar" : "Menu"}
				</button>
			</div>

			{isMenuOpen ? (
				<div className="min-[981px]:hidden">
					<MobileMenu
						activePath={pathname}
						onNavigate={() => setIsMenuOpen(false)}
					/>
				</div>
			) : null}
		</header>
	);
}
