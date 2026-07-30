import { cn } from "@plastlima-app/ui/lib/utils";
import Link from "next/link";
import type { NavItem } from "@/types/navigation";

type NavLinkProps = {
	item: NavItem;
	isActive: boolean;
	onNavigate?: () => void;
};

export function NavLink({ item, isActive, onNavigate }: NavLinkProps) {
	return (
		<Link
			aria-current={isActive ? "page" : undefined}
			className={cn(
				"relative px-3.5 py-2.5 font-semibold text-[14.5px] tracking-[-0.01em] transition-colors",
				isActive ? "text-brand" : "text-ink-muted hover:text-brand",
			)}
			href={item.href}
			onClick={onNavigate}
		>
			{item.label}
			<span
				className={cn(
					"absolute right-3.5 bottom-0.5 left-3.5 h-0.5 rounded-sm bg-brand transition-transform duration-300",
					isActive ? "scale-x-100" : "scale-x-0",
				)}
				style={{ transformOrigin: "left" }}
			/>
		</Link>
	);
}
