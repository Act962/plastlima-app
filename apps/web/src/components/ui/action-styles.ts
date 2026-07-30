import { cn } from "@plastlima-app/ui/lib/utils";

export type ActionVariant =
	| "primary"
	| "outline"
	| "yellow"
	| "yellowInk"
	| "outlineYellow"
	| "outlineLight"
	| "outlineDark";

export type ActionSize = "sm" | "md" | "lg";

const variantStyles: Record<ActionVariant, string> = {
	primary: "bg-brand text-white hover:bg-brand-dark",
	outline:
		"border-[1.5px] border-line-strong bg-surface text-ink hover:border-ink",
	yellow: "bg-yellow text-brand-dark hover:bg-yellow-soft",
	yellowInk: "bg-yellow text-ink hover:bg-yellow-bright",
	outlineYellow:
		"border-[1.5px] border-yellow text-white hover:bg-yellow hover:text-brand-dark",
	outlineLight: "border-[1.5px] border-white/30 text-white hover:border-white",
	outlineDark:
		"border-[1.5px] border-on-yellow text-on-yellow hover:bg-on-yellow hover:text-yellow",
};

const sizeStyles: Record<ActionSize, string> = {
	sm: "px-[15px] py-2.5 text-[13px]",
	md: "px-[18px] py-3 text-sm",
	lg: "px-7 py-4 text-[15px]",
};

type ActionStyleOptions = {
	variant?: ActionVariant;
	size?: ActionSize;
	className?: string;
};

/** Single source of truth for the pill-shaped actions used across the site. */
export function actionClassName({
	variant = "primary",
	size = "lg",
	className,
}: ActionStyleOptions = {}) {
	return cn(
		"inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-bold transition-colors",
		"focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2",
		"disabled:cursor-not-allowed disabled:opacity-60",
		variantStyles[variant],
		sizeStyles[size],
		className,
	);
}
