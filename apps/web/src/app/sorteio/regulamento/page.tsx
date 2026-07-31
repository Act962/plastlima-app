import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { JsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/ui/page-hero";
import { RAFFLE_CAMPAIGN } from "@/data/raffle";
import { RAFFLE_RULES } from "@/data/raffle-rules";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = buildPageMetadata({
	title: "Regulamento do sorteio",
	description: `Regras de participação da promoção ${RAFFLE_CAMPAIGN.prize} da Plastlima: período, quem pode participar, prêmio e data do sorteio.`,
	path: "/sorteio/regulamento",
});

export default function RaffleRulesPage() {
	return (
		<>
			<JsonLd
				data={breadcrumbSchema([
					{ name: "Início", path: "/" },
					{ name: RAFFLE_CAMPAIGN.seo.title, path: "/sorteio" },
					{ name: "Regulamento", path: "/sorteio/regulamento" },
				])}
			/>
			<PageHero
				description={`Condições de participação da promoção ${RAFFLE_CAMPAIGN.prize} — Mês dos Pais.`}
				eyebrow="Promoção"
				title="Regulamento do sorteio"
			/>
			<LegalDocument document={RAFFLE_RULES} />
		</>
	);
}
