import { ActionLink } from "@/components/ui/action-link";
import { Container } from "@/components/ui/container";
import { ContentImage } from "@/components/ui/content-image";
import { ExternalActionLink } from "@/components/ui/external-action-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { SplitLayout } from "@/components/ui/split-layout";
import { IMAGES } from "@/data/images";
import { CONTACT } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";

export function FranchisePreviewSection() {
	return (
		<Section border="top" tone="yellow">
			<Container className="py-section">
				<SplitLayout
					media={
						<div className="overflow-hidden rounded-[20px] border border-on-yellow/15 bg-surface p-6">
							<ContentImage
								alt="Franquias Plastlima"
								src={IMAGES.company.franchiseBadge}
							/>
						</div>
					}
				>
					<Eyebrow className="mb-[18px] text-brand-deep">03 — Expansão</Eyebrow>
					<h2 className="type-heading mb-[22px] font-extrabold">
						Seja um franqueado
					</h2>
					<p className="type-lead mb-8 text-on-yellow-muted">
						A Plastlima se tornou a primeira franquia no varejo de produtos
						descartáveis do Brasil, utilizando a mesma fórmula de sucesso que
						vem dando certo ao longo de vinte anos, mas sem esquecer de suas
						origens quando teve a oportunidade de trabalhar e …
					</p>
					<div className="flex flex-wrap gap-3">
						<ActionLink href="/franquias">
							Saiba mais sobre as franquias
						</ActionLink>
						<ExternalActionLink
							href={whatsappUrl(CONTACT.support.phone)}
							variant="outlineDark"
						>
							Seja um Franqueado
						</ExternalActionLink>
					</div>
				</SplitLayout>
			</Container>
		</Section>
	);
}
