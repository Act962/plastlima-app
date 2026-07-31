"use client";

import { cn } from "@plastlima-app/ui/lib/utils";
import Image from "next/image";
import { HERO_BANNERS } from "@/data/home";
import { useCarousel } from "@/hooks/use-carousel";
import { CarouselArrow } from "./carousel-arrow";
import { CarouselDots } from "./carousel-dots";

export function HeroCarousel() {
  const { activeIndex, goTo, goToPrevious, goToNext } = useCarousel(
    HERO_BANNERS.length,
  );

  // Com um único banner não há o que navegar: some com setas e indicadores.
  const hasMultiple = HERO_BANNERS.length > 1;

  return (
    <section
      aria-label="Destaques Plastlima"
      className="relative overflow-hidden bg-ink"
    >
      <div className="relative h-[clamp(320px,52vw,650px)] w-full">
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
            <Image
              alt={banner.alt}
              className="object-cover object-top"
              fill
              priority={index === 0}
              sizes="100vw"
              src={banner.src}
            />
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
