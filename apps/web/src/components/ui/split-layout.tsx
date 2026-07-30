import { cn } from "@plastlima-app/ui/lib/utils";
import type { ReactNode } from "react";

type SplitLayoutProps = {
	media: ReactNode;
	children: ReactNode;
	/** Puts the media column first on wide screens. */
	mediaFirst?: boolean;
	className?: string;
};

/** Two-column "copy + image" arrangement repeated across the site. */
export function SplitLayout({
	media,
	children,
	mediaFirst,
	className,
}: SplitLayoutProps) {
	return (
		<div
			className={cn(
				"grid items-center gap-[clamp(40px,5vw,72px)]",
				"grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))]",
				className,
			)}
		>
			<div className={cn(mediaFirst ? "lg:order-first" : "lg:order-last")}>
				{media}
			</div>
			<div className={cn(mediaFirst ? "lg:order-last" : "lg:order-first")}>
				{children}
			</div>
		</div>
	);
}
