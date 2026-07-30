import { Container } from "@/components/ui/container";
import { ContentImage } from "@/components/ui/content-image";
import { ExternalActionLink } from "@/components/ui/external-action-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { MediaFrame } from "@/components/ui/media-frame";
import { Section } from "@/components/ui/section";
import { SplitLayout } from "@/components/ui/split-layout";
import { IMAGES } from "@/data/images";
import { CONTACT } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";

const IMAGE_SRC = IMAGES.company.warehouse;

type DistributionCenterSectionProps = {
	eyebrow?: string;
	border?: "y" | "top";
};

/** Shared between the home page and the about page. */
export function DistributionCenterSection({
	eyebrow,
	border = "y",
}: DistributionCenterSectionProps) {
	return (
		<Section border={border} tone="surface">
			<Container className="py-section">
				<SplitLayout
					mediaFirst
					media={
						<MediaFrame>
							<ContentImage
								alt="Centro de distribuição Plastlima"
								src={IMAGE_SRC}
							/>
						</MediaFrame>
					}
				>
					{eyebrow ? <Eyebrow className="mb-[18px]">{eyebrow}</Eyebrow> : null}
					<h2 className="type-heading mb-[22px] font-extrabold">
						Centro de distribuição
					</h2>
					<p className="type-lead mb-8 text-body">
						No centro de distribuição da PlastLima, operamos com eficiência para
						atender a demanda do mercado atacadista nos estados do{" "}
						<strong className="text-ink">Piauí e Maranhão</strong>. Nossa equipe
						está pronta para fornecer{" "}
						<strong className="text-ink">soluções personalizadas</strong> para
						clientes de{" "}
						<strong className="text-ink">Teresina, Timon, Caxias</strong> e
						também para o interior dos estados do{" "}
						<strong className="text-ink">Piauí e Maranhão</strong>.
					</p>
					<ExternalActionLink href={whatsappUrl(CONTACT.support.phone)}>
						Falar com atendimento
					</ExternalActionLink>
				</SplitLayout>
			</Container>
		</Section>
	);
}
