import { cn } from "@plastlima-app/ui/lib/utils";
import type { ReactNode } from "react";

type EyebrowProps = {
	children: ReactNode;
	className?: string;
};

/** Small mono label that opens most sections ("01 — Quem somos"). */
export function Eyebrow({ children, className }: EyebrowProps) {
	return (
		<p
			className={cn(
				"type-eyebrow font-mono text-brand uppercase tracking-[0.1em]",
				className,
			)}
		>
			{children}
		</p>
	);
}
