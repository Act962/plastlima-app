import { cn } from "@plastlima-app/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

type TextLinkProps = {
	href: Route;
	children: ReactNode;
	className?: string;
};

/** Inline link with the brand underline, used for "keep reading" style calls to action. */
export function TextLink({ href, children, className }: TextLinkProps) {
	return (
		<Link
			className={cn(
				"inline-flex items-center gap-2 border-brand border-b-2 pb-[3px] font-bold text-[15.5px] text-ink transition-colors hover:text-brand",
				className,
			)}
			href={href}
		>
			{children}
		</Link>
	);
}
