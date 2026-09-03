import Image from "next/image";
import { LuImage } from "react-icons/lu";
import type { RaffleImage } from "@/types/raffle";

type Props = {
	image: RaffleImage | undefined;
	className?: string;
	imageClassName?: string;
	/** Proporção do marcador enquanto não há arte, largura ÷ altura. */
	placeholderAspect?: string;
	priority?: boolean;
	sizes?: string;
};

/**
 * Arte da campanha — ou o espaço reservado para ela.
 *
 * A peça gráfica costuma ficar pronta depois do resto. Em vez de apontar para um
 * arquivo inexistente (que renderiza o ícone de imagem quebrada) ou de sumir com
 * a coluna inteira (que desmonta o layout), o slot fica visível e nomeado até
 * alguém preencher `image` em `data/raffle.ts`.
 */
export function RaffleArt({
	image,
	className,
	imageClassName,
	placeholderAspect = "16 / 10",
	priority,
	sizes,
}: Props) {
	if (image === undefined) {
		return (
			<div
				className={`flex flex-col items-center justify-center gap-2 bg-white/10 text-center text-white/70 ${className ?? ""}`}
				style={{ aspectRatio: placeholderAspect }}
			>
				<LuImage aria-hidden className="size-8" />
				<span className="type-eyebrow font-mono uppercase tracking-[0.1em]">
					Arte da campanha
				</span>
				<span className="text-[12.5px]">Em produção</span>
			</div>
		);
	}

	return (
		<Image
			alt={image.alt}
			className={imageClassName}
			height={image.height}
			priority={priority}
			sizes={sizes}
			src={image.src}
			width={image.width}
		/>
	);
}
