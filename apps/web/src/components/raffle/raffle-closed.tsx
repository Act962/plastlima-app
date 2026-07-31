import { Container } from "@/components/ui/container";
import { ExternalActionLink } from "@/components/ui/external-action-link";
import { Section } from "@/components/ui/section";
import { RAFFLE_CAMPAIGN } from "@/data/raffle";
import { EXTERNAL_LINKS } from "@/data/site";

/** Substitui o formulário depois da data de encerramento das inscrições. */
export function RaffleClosed() {
	return (
		<Section tone="muted">
			<Container className="py-section-xs text-center" width="reading">
				<h2 className="type-heading-sm mb-4 font-extrabold">
					{RAFFLE_CAMPAIGN.closed.title}
				</h2>
				<p className="mx-auto mb-8 max-w-[520px] text-[17px] text-body-muted leading-[1.65]">
					{RAFFLE_CAMPAIGN.closed.message}
				</p>
				<ExternalActionLink href={EXTERNAL_LINKS.onlineCatalog}>
					Conheça nossos produtos
				</ExternalActionLink>
			</Container>
		</Section>
	);
}
