import { cn } from "@plastlima-app/ui/lib/utils";
import type { ReactNode } from "react";

type ContainerWidth = "site" | "reading";

const widthStyles: Record<ContainerWidth, string> = {
	site: "max-w-site",
	reading: "max-w-reading",
};

type ContainerProps = {
	children: ReactNode;
	width?: ContainerWidth;
	className?: string;
};

export function Container({
	children,
	width = "site",
	className,
}: ContainerProps) {
	return (
		<div
			className={cn(
				"mx-auto w-full px-5 sm:px-8",
				widthStyles[width],
				className,
			)}
		>
			{children}
		</div>
	);
}
