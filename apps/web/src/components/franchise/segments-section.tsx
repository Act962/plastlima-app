import { Container } from "@/components/ui/container";
import { ExternalActionLink } from "@/components/ui/external-action-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { CONTACT } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";

type SegmentsSectionProps = {
	segments: string[];
};

export function SegmentsSection({ segments }: SegmentsSectionProps) {
	return (
		<Section tone="yellow">
			<Container className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] items-center gap-[clamp(36px,4vw,64px)] py-section-sm">
				<div>
					<Eyebrow className="mb-3.5 text-brand-deep">Mix de mais de</Eyebrow>
					<p className="font-display font-extrabold text-[clamp(72px,10vw,104px)] text-brand leading-[0.9] tracking-[-0.04em]">
						100
					</p>
					<p className="mt-2 font-bold font-display text-[26px] text-brand tracking-[0.02em]">
						PRODUTOS
					</p>
				</div>
				<div>
					<ul className="mb-9 flex flex-wrap gap-2.5">
						{segments.map((segment) => (
							<li
								className="rounded-full border border-on-yellow/25 px-4 py-2.5 text-on-yellow text-sm"
								key={segment}
							>
								{segment}
							</li>
						))}
					</ul>
					<ExternalActionLink href={whatsappUrl(CONTACT.franchise.phone)}>
						Fale diretamente com um consultor
					</ExternalActionLink>
				</div>
			</Container>
		</Section>
	);
}
