import type { Metadata } from "next";
import { LocationsExplorer } from "@/components/locations/locations-explorer";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { STORE_LOCATIONS } from "@/data/locations";

export const metadata: Metadata = {
	title: "Unidades",
	description:
		"Encontre a loja PlastLima mais próxima de você no Piauí, Maranhão e Pernambuco: endereços, horários e contato.",
};

export default function LocationsPage() {
	return (
		<>
			<PageHero
				eyebrow="Unidades"
				title="Encontre a unidade mais próxima de você"
			/>
			<Section>
				<Container className="pt-10 pb-[clamp(64px,9vw,112px)]">
					<LocationsExplorer locations={STORE_LOCATIONS} />
				</Container>
			</Section>
		</>
	);
}
