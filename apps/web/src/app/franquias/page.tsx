import type { Metadata } from "next";
import { CompanyTimeline } from "@/components/franchise/company-timeline";
import { FranchiseAboutSection } from "@/components/franchise/franchise-about-section";
import { FranchiseFormSection } from "@/components/franchise/franchise-form-section";
import { FranchiseHero } from "@/components/franchise/franchise-hero";
import { MarketDataSection } from "@/components/franchise/market-data-section";
import { SegmentsSection } from "@/components/franchise/segments-section";
import { JsonLd } from "@/components/seo/json-ld";
import { getFranchiseContent } from "@/lib/content/franchise";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = buildPageMetadata({
	title: "Seja um franqueado",
	description:
		"Seja dono da primeira franquia no varejo de descartáveis do Brasil. Conheça o modelo de negócio Plastlima, o investimento e cadastre-se para ser um franqueado.",
	path: "/franquias",
});

export default async function FranchisePage() {
	const franchise = await getFranchiseContent();

	return (
		<>
			<JsonLd
				data={breadcrumbSchema([
					{ name: "Início", path: "/" },
					{ name: "Seja um franqueado", path: "/franquias" },
				])}
			/>
			<FranchiseHero />
			<CompanyTimeline entries={franchise.timeline} />
			<FranchiseAboutSection paragraphs={franchise.about} />
			<MarketDataSection images={franchise.marketImages} />
			<FranchiseFormSection />
			<SegmentsSection segments={franchise.segments} />
		</>
	);
}
