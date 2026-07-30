import type { Metadata } from "next";
import { CompanyTimeline } from "@/components/franchise/company-timeline";
import { FranchiseAboutSection } from "@/components/franchise/franchise-about-section";
import { FranchiseFormSection } from "@/components/franchise/franchise-form-section";
import { FranchiseHero } from "@/components/franchise/franchise-hero";
import { MarketDataSection } from "@/components/franchise/market-data-section";
import { SegmentsSection } from "@/components/franchise/segments-section";

export const metadata: Metadata = {
	title: "Seja um franqueado",
	description:
		"A primeira franquia no varejo de produtos descartáveis do Brasil. Conheça o modelo de negócio PlastLima e cadastre-se.",
};

export default function FranchisePage() {
	return (
		<>
			<FranchiseHero />
			<CompanyTimeline />
			<FranchiseAboutSection />
			<MarketDataSection />
			<FranchiseFormSection />
			<SegmentsSection />
		</>
	);
}
