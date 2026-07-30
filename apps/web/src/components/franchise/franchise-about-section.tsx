import { Container } from "@/components/ui/container";
import { ContentImage } from "@/components/ui/content-image";
import { MediaFrame } from "@/components/ui/media-frame";
import { Section } from "@/components/ui/section";
import { SplitLayout } from "@/components/ui/split-layout";
import { FRANCHISE_ABOUT_PARAGRAPHS } from "@/data/franchise";
import { IMAGES } from "@/data/images";

export function FranchiseAboutSection() {
	return (
		<Section border="y" tone="surface">
			<Container className="py-section">
				<SplitLayout
					media={
						<MediaFrame>
							<ContentImage
								alt="Sede da Plastlima"
								src={IMAGES.company.distributionCenter}
							/>
						</MediaFrame>
					}
				>
					<h2 className="type-heading mb-6 font-extrabold">
						Sobre a Plastlima
					</h2>
					<div className="flex flex-col gap-[22px]">
						{FRANCHISE_ABOUT_PARAGRAPHS.map((paragraph) => (
							<p
								className="type-lead text-body leading-[1.7]"
								key={paragraph.slice(0, 32)}
							>
								{paragraph}
							</p>
						))}
					</div>
				</SplitLayout>
			</Container>
		</Section>
	);
}
