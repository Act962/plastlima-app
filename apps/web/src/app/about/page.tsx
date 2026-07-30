import type { Metadata } from "next";
import { CompanyStory } from "@/components/about/company-story";
import { WelcomeBanner } from "@/components/about/welcome-banner";
import { DistributionCenterSection } from "@/components/sections/distribution-center-section";
import { JsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/ui/page-hero";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = buildPageMetadata({
	title: "Sobre a Plastlima — Nossa história",
	description:
		"Conheça a história da PlastLima: de um box de 30m² na Ceasa de Teresina em 2002 a uma rede de franquias com 14 lojas em três estados do Nordeste.",
	path: "/about",
});

export default function AboutPage() {
	return (
		<>
			<JsonLd
				data={breadcrumbSchema([
					{ name: "Início", path: "/" },
					{ name: "Sobre nós", path: "/about" },
				])}
			/>
			<PageHero eyebrow="Sobre nós" title="A PlastLima" />
			<CompanyStory />
			<WelcomeBanner />
			<DistributionCenterSection border="top" />
		</>
	);
}
