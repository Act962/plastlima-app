import type { ReactNode } from "react";
import {
	type ActionSize,
	type ActionVariant,
	actionClassName,
} from "./action-styles";

type ExternalActionLinkProps = {
	href: string;
	children: ReactNode;
	variant?: ActionVariant;
	size?: ActionSize;
	className?: string;
};

/** Pill action pointing to an external destination (catalog, WhatsApp, PDF). */
export function ExternalActionLink({
	href,
	children,
	variant,
	size,
	className,
}: ExternalActionLinkProps) {
	return (
		<a
			className={actionClassName({ variant, size, className })}
			href={href}
			rel="noreferrer"
			target="_blank"
		>
			{children}
		</a>
	);
}
