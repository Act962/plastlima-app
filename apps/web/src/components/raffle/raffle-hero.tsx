import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { RAFFLE_CAMPAIGN } from "@/data/raffle";
import { RAFFLE_FORM_ID } from "./constants";

export function RaffleHero() {
	const { hero, prize, drawDateLabel } = RAFFLE_CAMPAIGN;

	return (
		<Section tone="brand">
			<Container className="grid grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] items-center gap-[clamp(40px,5vw,64px)] pt-[clamp(48px,6.5vw,88px)] pb-[clamp(56px,7vw,96px)]">
				<div>
					<Eyebrow className="mb-[22px] text-yellow">{hero.eyebrow}</Eyebrow>
					<h1 className="type-display mb-[22px] font-extrabold text-white">
						{hero.title}
					</h1>
					<p className="mb-8 max-w-[520px] text-[18.5px] text-white leading-[1.6]">
						{hero.lead}
					</p>

					<dl className="mb-9 flex flex-wrap gap-x-10 gap-y-4 border-white/20 border-t pt-6">
						<div>
							<dt className="type-eyebrow font-mono text-white/70 uppercase tracking-[0.1em]">
								Prêmio
							</dt>
							<dd className="mt-1 font-display font-extrabold text-[22px] text-yellow">
								{prize}
							</dd>
						</div>
						<div>
							<dt className="type-eyebrow font-mono text-white/70 uppercase tracking-[0.1em]">
								Sorteio em
							</dt>
							<dd className="mt-1 font-display font-extrabold text-[22px] text-white">
								{drawDateLabel}
							</dd>
						</div>
					</dl>

					<a
						className="inline-flex cursor-pointer items-center justify-center rounded-full bg-yellow px-[30px] py-4 font-bold text-[15px] text-ink transition-colors hover:bg-yellow-bright focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
						href={`#${RAFFLE_FORM_ID}`}
					>
						{hero.ctaLabel}
					</a>
				</div>

				<div className="overflow-hidden rounded-[20px] border border-white/15">
					<Image
						alt={hero.image.alt}
						className="h-auto w-full"
						height={hero.image.height}
						priority
						sizes="(max-width: 1024px) 100vw, 600px"
						src={hero.image.src}
						width={hero.image.width}
					/>
				</div>
			</Container>
		</Section>
	);
}
