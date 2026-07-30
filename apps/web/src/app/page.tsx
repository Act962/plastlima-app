import type { Metadata } from "next";
import { AboutPreviewSection } from "@/components/home/about-preview-section";
import { CatalogCtaSection } from "@/components/home/catalog-cta-section";
import { FranchisePreviewSection } from "@/components/home/franchise-preview-section";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { OffersSection } from "@/components/home/offers-section";
import { StatsBand } from "@/components/home/stats-band";
import { DistributionCenterSection } from "@/components/sections/distribution-center-section";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
	title: "Plastlima — Descartáveis e embalagens no Piauí e Maranhão",
	titleAbsolute: true,
	description:
		"Distribuidora de descartáveis, embalagens e utilidades com mais de 1.500 produtos. Atacado e varejo em 14 lojas no Piauí, Maranhão e Pernambuco desde 2002.",
	path: "/",
});

export default function HomePage() {
	return (
		<>
			{/* Único h1 da home: invisível, dá à página raiz um cabeçalho para busca e leitores de tela. */}
			<h1 className="sr-only">
				Plastlima — distribuidora de descartáveis, embalagens e utilidades no
				Piauí, Maranhão e Pernambuco
			</h1>
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
