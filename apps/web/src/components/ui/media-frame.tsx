import { cn } from "@plastlima-app/ui/lib/utils";
import type { ReactNode } from "react";

type MediaFrameProps = {
	children: ReactNode;
	className?: string;
};

/** Rounded, bordered surface used to hold every editorial image. */
export function MediaFrame({ children, className }: MediaFrameProps) {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-[20px] border border-line bg-surface",
				className,
			)}
		>
			{children}
		</div>
	);
}
