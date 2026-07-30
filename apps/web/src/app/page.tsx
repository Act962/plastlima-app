import { AboutPreviewSection } from "@/components/home/about-preview-section";
import { CatalogCtaSection } from "@/components/home/catalog-cta-section";
import { FranchisePreviewSection } from "@/components/home/franchise-preview-section";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { OffersSection } from "@/components/home/offers-section";
import { StatsBand } from "@/components/home/stats-band";
import { DistributionCenterSection } from "@/components/sections/distribution-center-section";

export default function HomePage() {
	return (
		<>
			<HeroCarousel />
			<StatsBand />
			<AboutPreviewSection />
			<DistributionCenterSection eyebrow="02 — Logística" />
			<CatalogCtaSection />
			<FranchisePreviewSection />
			<OffersSection />
		</>
	);
}
