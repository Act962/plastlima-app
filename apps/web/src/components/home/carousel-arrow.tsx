import { cn } from "@plastlima-app/ui/lib/utils";

type CarouselArrowProps = {
	direction: "previous" | "next";
	label: string;
	onClick: () => void;
};

export function CarouselArrow({
	direction,
	label,
	onClick,
}: CarouselArrowProps) {
	return (
		<button
			aria-label={label}
			className={cn(
				"absolute top-1/2 flex size-[46px] -translate-y-1/2 cursor-pointer items-center justify-center",
				"rounded-full bg-white/90 font-bold text-[20px] text-ink shadow-[0_6px_18px_rgba(0,0,0,.18)]",
				"transition-colors hover:bg-white",
				direction === "previous"
					? "left-[clamp(10px,2vw,24px)]"
					: "right-[clamp(10px,2vw,24px)]",
			)}
			onClick={onClick}
			type="button"
		>
			{direction === "previous" ? "‹" : "›"}
		</button>
	);
}
