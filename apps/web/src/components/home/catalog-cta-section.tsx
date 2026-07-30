import { Container } from "@/components/ui/container";
import { ExternalActionLink } from "@/components/ui/external-action-link";
import { Section } from "@/components/ui/section";
import { EXTERNAL_LINKS } from "@/data/site";

export function CatalogCtaSection() {
	return (
		<Section>
			<Container className="py-section-sm">
				<div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] items-center gap-10 rounded-3xl bg-brand p-[clamp(32px,4vw,64px)] text-white">
					<div>
						<h2 className="type-heading-sm mb-3.5 font-extrabold text-yellow">
							Mix com mais de 1500 produtos
						</h2>
						<p className="font-mono text-[12.5px] text-yellow-pale uppercase tracking-[0.1em]">
							Confira nosso catálogo atualizado
						</p>
					</div>
					<div className="flex flex-col gap-3">
						<ExternalActionLink
							href={EXTERNAL_LINKS.catalogPdf}
							variant="yellow"
						>
							Download do catálogo (PDF)
						</ExternalActionLink>
						<ExternalActionLink
							href={EXTERNAL_LINKS.onlineCatalog}
							variant="outlineYellow"
						>
							Catálogo online
						</ExternalActionLink>
					</div>
				</div>
			</Container>
		</Section>
	);
}
