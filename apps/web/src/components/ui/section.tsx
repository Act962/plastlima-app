import { cn } from "@plastlima-app/ui/lib/utils";
import type { ReactNode } from "react";

export type SectionTone =
	| "canvas"
	| "surface"
	| "muted"
	| "yellow"
	| "brand"
	| "ink";
type SectionBorder = "none" | "top" | "bottom" | "y";

const toneStyles: Record<SectionTone, string> = {
	canvas: "bg-canvas text-ink",
	surface: "bg-surface text-ink",
	muted: "bg-surface-muted text-ink",
	yellow: "bg-yellow text-on-yellow",
	brand: "bg-brand text-white",
	ink: "bg-ink text-white",
};

const borderStyles: Record<SectionBorder, string> = {
	none: "",
	top: "border-t",
	bottom: "border-b",
	y: "border-y",
};

const borderColorStyles: Record<SectionTone, string> = {
	canvas: "border-line",
	surface: "border-line",
	muted: "border-line",
	yellow: "border-on-yellow/15",
	brand: "border-white/20",
	ink: "border-white/10",
};

type SectionProps = {
	children: ReactNode;
	id?: string;
	tone?: SectionTone;
	border?: SectionBorder;
	className?: string;
};

export function Section({
	children,
	id,
	tone = "canvas",
	border = "none",
	className,
}: SectionProps) {
	return (
		<section
			className={cn(
				toneStyles[tone],
				borderStyles[border],
				border !== "none" && borderColorStyles[tone],
				className,
			)}
			id={id}
		>
			{children}
		</section>
	);
}
