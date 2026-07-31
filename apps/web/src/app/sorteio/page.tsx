import { areEntriesOpen } from "@plastlima-app/core";
import type { Metadata } from "next";
import { HowItWorks } from "@/components/raffle/how-it-works";
import { RaffleClosed } from "@/components/raffle/raffle-closed";
import { RaffleFormSection } from "@/components/raffle/raffle-form-section";
import { RaffleHero } from "@/components/raffle/raffle-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { RAFFLE_CAMPAIGN } from "@/data/raffle";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = buildPageMetadata({
	title: RAFFLE_CAMPAIGN.seo.title,
	description: RAFFLE_CAMPAIGN.seo.description,
	path: "/sorteio",
	image: {
		url: RAFFLE_CAMPAIGN.hero.image.src,
		width: RAFFLE_CAMPAIGN.hero.image.width,
		height: RAFFLE_CAMPAIGN.hero.image.height,
		alt: RAFFLE_CAMPAIGN.hero.image.alt,
	},
});

/**
 * Revalida de tempos em tempos porque a página troca o formulário pelo aviso de
 * encerramento com base na data. Não precisa ser exata: quem realmente barra um
 * cadastro fora do prazo é a Server Action, que consulta o relógio a cada envio.
 */
export const revalidate = 600;

export default function RafflePage() {
	const entriesOpen = areEntriesOpen(
		{ id: RAFFLE_CAMPAIGN.id, entriesCloseAt: RAFFLE_CAMPAIGN.entriesCloseAt },
		new Date(),
	);

	return (
		<>
			<JsonLd
				data={breadcrumbSchema([
					{ name: "Início", path: "/" },
					{ name: RAFFLE_CAMPAIGN.seo.title, path: "/sorteio" },
				])}
			/>
			<RaffleHero />
			<HowItWorks />
			{entriesOpen ? <RaffleFormSection /> : <RaffleClosed />}
		</>
	);
}
