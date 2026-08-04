import type { MarketImageContent } from "@plastlima-app/core/schemas";
import { Container } from "@/components/ui/container";
import { ContentImage } from "@/components/ui/content-image";
import { Section } from "@/components/ui/section";

type MarketDataSectionProps = {
	images: MarketImageContent[];
};

export function MarketDataSection({ images }: MarketDataSectionProps) {
	return (
		<Section>
			<Container className="py-section">
				<h2 className="type-heading-sm mb-3.5 max-w-[760px] font-extrabold">
					Amplo mercado financeiro que mais cresce no país
				</h2>
				<p className="type-lead mb-12 max-w-[640px] text-body-muted leading-[1.6]">
					Estes números fazem do mercado de embalagens no Brasil o quinto maior
					do mundo.
				</p>
				<ul className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-5">
					{images.map((image) => (
						<li
							className="flex items-center justify-center rounded-[18px] border border-line bg-surface p-6"
							key={image.src}
						>
							<ContentImage alt={image.alt} src={image.src} />
						</li>
					))}
				</ul>
			</Container>
		</Section>
	);
}
