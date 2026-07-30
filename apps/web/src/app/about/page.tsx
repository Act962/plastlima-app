import type { Metadata } from "next";
import { CompanyStory } from "@/components/about/company-story";
import { WelcomeBanner } from "@/components/about/welcome-banner";
import { DistributionCenterSection } from "@/components/sections/distribution-center-section";
import { PageHero } from "@/components/ui/page-hero";

export const metadata: Metadata = {
	title: "Sobre nós",
	description:
		"A história da PlastLima: de um box de 30m² na Ceasa de Teresina a uma rede de franquias presente em três estados.",
};

export default function AboutPage() {
	return (
		<>
			<PageHero eyebrow="Sobre nós" title="A PlastLima" />
			<CompanyStory />
			<WelcomeBanner />
			<DistributionCenterSection border="top" />
		</>
	);
}
