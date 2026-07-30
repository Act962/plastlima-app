import { Container } from "@/components/ui/container";
import { ContentImage } from "@/components/ui/content-image";
import { Eyebrow } from "@/components/ui/eyebrow";
import { MediaFrame } from "@/components/ui/media-frame";
import { Section } from "@/components/ui/section";
import { SplitLayout } from "@/components/ui/split-layout";
import { TextLink } from "@/components/ui/text-link";
import { ABOUT_SUMMARY } from "@/data/about";
import { IMAGES } from "@/data/images";

export function AboutPreviewSection() {
	return (
		<Section>
			<Container className="py-section">
				<SplitLayout
					media={
						<MediaFrame>
							<ContentImage
								alt="Centro de distribuição Plastlima"
								src={IMAGES.company.distributionCenter}
							/>
						</MediaFrame>
					}
				>
					<Eyebrow className="mb-[18px]">01 — Quem somos</Eyebrow>
					<h2 className="type-heading mb-[22px] font-extrabold">Sobre nós</h2>
					<p className="type-lead mb-[30px] text-body">{ABOUT_SUMMARY}</p>
					<TextLink href="/about">Continue lendo →</TextLink>
				</SplitLayout>
			</Container>
		</Section>
	);
}
