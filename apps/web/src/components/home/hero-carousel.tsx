"use client";

import { cn } from "@plastlima-app/ui/lib/utils";
import { getImageProps } from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { HERO_BANNERS } from "@/data/home";
import { useCarousel } from "@/hooks/use-carousel";
import type { HeroBanner } from "@/types/content";
import { CarouselArrow } from "./carousel-arrow";
import { CarouselDots } from "./carousel-dots";

/** Proporção da faixa quando o banner não declara a dele. */
const FALLBACK_ASPECT = 1.92;

/** Complemento exato do breakpoint `sm` do Tailwind (40rem). */
const MOBILE_MEDIA = "(max-width: 39.999rem)";

/**
 * No celular todos os slides dividem a mesma altura, senão a página pularia a
 * cada troca. A referência é a arte de celular mais alta declarada; banner sem
 * arte própria aparece inteiro dentro dessa caixa, com o fundo borrado
 * preenchendo a sobra. Sem nenhuma arte de celular, cada banner usa a
 * proporção dele mesmo.
 */
const MOBILE_ASPECT = HERO_BANNERS.reduce<number | undefined>(
	(tallest, banner) =>
		banner.mobile === undefined
			? tallest
			: Math.min(tallest ?? banner.mobile.aspect, banner.mobile.aspect),
	undefined,
);

/**
 * `<picture>` em vez de `<Image>` porque só ele troca de arquivo por media
 * query — assim o celular baixa apenas a arte de celular, e não as duas.
 * `getImageProps` continua gerando o srcset otimizado do Next.
 */
function BannerArt({
	banner,
	priority,
}: {
	banner: HeroBanner;
	priority: boolean;
}) {
	const shared = { alt: banner.alt, fill: true, priority, sizes: "100vw" };
	const { props: art } = getImageProps({ ...shared, src: banner.src });
	const mobileArt = banner.mobile
		? getImageProps({ ...shared, src: banner.mobile.src }).props
		: undefined;

	const layer = (className: string, decorative: boolean) => (
		<picture>
			{mobileArt === undefined ? null : (
				<source media={MOBILE_MEDIA} srcSet={mobileArt.srcSet} />
			)}
			<img
				{...art}
				alt={decorative ? "" : banner.alt}
				aria-hidden={decorative || undefined}
				className={className}
				// `getImageProps` não repassa a prioridade; sem isso o primeiro
				// banner, que é o LCP da home, disputa banda com o resto da página.
				fetchPriority={priority ? "high" : undefined}
			/>
		</picture>
	);

	return (
		<>
			{/* A sobra entre a arte e a faixa — que só existe quando as proporções
			 * não batem — vira uma cópia borrada da própria imagem, nunca uma faixa
			 * vazia. */}
			{layer("scale-110 object-cover blur-2xl", true)}
			{layer("object-contain", false)}
		</>
	);
}

export function HeroCarousel() {
	const { activeIndex, goTo, goToPrevious, goToNext } = useCarousel(
		HERO_BANNERS.length,
	);

	// Com um único banner não há o que navegar: some com setas e indicadores.
	const hasMultiple = HERO_BANNERS.length > 1;

	// No desktop a faixa assume a proporção do banner visível, então a arte
	// preenche a área inteira sem sobra; banners de proporções diferentes fazem
	// a altura animar junto com o crossfade.
	const aspect = HERO_BANNERS[activeIndex]?.aspect ?? FALLBACK_ASPECT;
	const mobileAspect = MOBILE_ASPECT ?? aspect;

	return (
		<section
			aria-label="Destaques Plastlima"
			className="relative overflow-hidden bg-ink"
		>
			{/* O teto de 85vh protege de artes em pé, que senão empurrariam o resto
			 * da home para fora da tela em monitores largos. */}
			<div
				className="relative aspect-[var(--hero-aspect-mobile)] max-h-[85vh] w-full transition-[aspect-ratio] duration-700 sm:aspect-[var(--hero-aspect)]"
				style={
					{
						"--hero-aspect": String(aspect),
						"--hero-aspect-mobile": String(mobileAspect),
					} as CSSProperties
				}
			>
				{HERO_BANNERS.map((banner, index) => (
					<div
						aria-hidden={index !== activeIndex}
						className={cn(
							"absolute inset-0 transition-opacity duration-700",
							index === activeIndex
								? "pointer-events-auto opacity-100"
								: "pointer-events-none opacity-0",
						)}
						key={banner.src}
					>
						{banner.href === undefined ? (
							<BannerArt banner={banner} priority={index === 0} />
						) : (
							// O banner só recebe foco quando é o slide visível — senão o Tab
							// passaria por links escondidos atrás dos outros.
							<Link
								className="block size-full focus-visible:outline-2 focus-visible:outline-yellow focus-visible:-outline-offset-4"
								href={banner.href}
								tabIndex={index === activeIndex ? undefined : -1}
							>
								<BannerArt banner={banner} priority={index === 0} />
							</Link>
						)}
					</div>
				))}
			</div>

			{hasMultiple ? (
				<>
					<CarouselArrow
						direction="previous"
						label="Banner anterior"
						onClick={goToPrevious}
					/>
					<CarouselArrow
						direction="next"
						label="Próximo banner"
						onClick={goToNext}
					/>
					<CarouselDots
						activeIndex={activeIndex}
						onSelect={goTo}
						slideKeys={HERO_BANNERS.map((banner) => banner.src)}
					/>
				</>
			) : null}
		</section>
	);
}
