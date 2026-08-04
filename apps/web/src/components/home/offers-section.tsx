import type { MediaItemContent } from "@plastlima-app/core/schemas";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { ExternalActionLink } from "@/components/ui/external-action-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { EXTERNAL_LINKS } from "@/data/site";

export function OffersSection({ offers }: { offers: MediaItemContent[] }) {
	return (
		<Section>
			<Container className="py-section">
				<div className="mb-10 flex flex-wrap items-end justify-between gap-8">
					<div>
						<Eyebrow className="mb-[18px]">04 — Novidades</Eyebrow>
						<h2 className="type-heading max-w-[640px] font-extrabold">
							Confira ofertas, promoções e novidades da Plastlima
						</h2>
					</div>
					<ExternalActionLink
						className="whitespace-nowrap"
						href={EXTERNAL_LINKS.onlineCatalog}
						variant="outline"
					>
						Acesse nosso Catálogo
					</ExternalActionLink>
				</div>

				<ul className="grid grid-cols-[repeat(auto-fit,minmax(min(168px,100%),1fr))] gap-4">
					{offers.map((offer) => (
						<li key={offer.src}>
							<a
								className="block aspect-square overflow-hidden rounded-[14px] border border-line bg-canvas transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(16,20,24,.1)]"
								href={EXTERNAL_LINKS.onlineCatalog}
								rel="noreferrer"
								target="_blank"
							>
								<Image
									alt={offer.alt}
									className="size-full object-cover"
									height={400}
									sizes="(max-width: 640px) 50vw, 200px"
									src={offer.src}
									width={400}
								/>
							</a>
						</li>
					))}
				</ul>
			</Container>
		</Section>
	);
}
