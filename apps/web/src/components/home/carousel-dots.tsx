import { cn } from "@plastlima-app/ui/lib/utils";

type CarouselDotsProps = {
	/** Stable key per slide, in slide order. */
	slideKeys: string[];
	activeIndex: number;
	onSelect: (index: number) => void;
};

export function CarouselDots({
	slideKeys,
	activeIndex,
	onSelect,
}: CarouselDotsProps) {
	return (
		<div className="absolute right-0 bottom-[18px] left-0 flex justify-center gap-[9px]">
			{slideKeys.map((slideKey, index) => (
				<button
					aria-current={index === activeIndex}
					aria-label={`Ir para o banner ${index + 1}`}
					className={cn(
						"h-[9px] cursor-pointer rounded-full transition-all duration-300",
						index === activeIndex
							? "w-[26px] bg-white"
							: "w-[9px] bg-yellow/60",
					)}
					key={slideKey}
					onClick={() => onSelect(index)}
					type="button"
				/>
			))}
		</div>
	);
}
