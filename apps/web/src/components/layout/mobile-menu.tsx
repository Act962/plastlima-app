import Link from "next/link";
import { ExternalActionLink } from "@/components/ui/external-action-link";
import { CONTACT, EXTERNAL_LINKS } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";
import type { NavItem } from "@/types/navigation";

type MobileMenuProps = {
	activePath: string;
	items: NavItem[];
	onNavigate: () => void;
};

export function MobileMenu({ activePath, items, onNavigate }: MobileMenuProps) {
	return (
		<nav
			aria-label="Menu principal"
			className="border-line border-t bg-surface px-5 pt-4 pb-[22px]"
			id="mobile-menu"
		>
			<ul className="flex flex-col">
				{items.map((item) => (
					<li key={item.href}>
						<Link
							aria-current={activePath === item.href ? "page" : undefined}
							className="block border-line-soft border-b px-1 py-3.5 font-bold text-[17px] text-ink transition-colors hover:text-brand aria-[current=page]:text-brand"
							href={item.href}
							onClick={onNavigate}
						>
							{item.label}
						</Link>
					</li>
				))}
			</ul>
			<div className="mt-4 flex flex-wrap gap-2.5">
				<ExternalActionLink
					className="flex-1"
					href={EXTERNAL_LINKS.onlineCatalog}
					size="md"
					variant="outline"
				>
					Catálogo
				</ExternalActionLink>
				<ExternalActionLink
					className="flex-1"
					href={whatsappUrl(CONTACT.support.phone)}
					size="md"
				>
					WhatsApp
				</ExternalActionLink>
			</div>
		</nav>
	);
}
