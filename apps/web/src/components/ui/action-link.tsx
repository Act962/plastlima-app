import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
	type ActionSize,
	type ActionVariant,
	actionClassName,
} from "./action-styles";

type ActionLinkProps = {
	href: Route;
	children: ReactNode;
	variant?: ActionVariant;
	size?: ActionSize;
	className?: string;
};

/** Pill action pointing to an internal route. */
export function ActionLink({
	href,
	children,
	variant,
	size,
	className,
}: ActionLinkProps) {
	return (
		<Link className={actionClassName({ variant, size, className })} href={href}>
			{children}
		</Link>
	);
}
