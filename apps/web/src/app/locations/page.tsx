import type { Metadata } from "next";
import { LocationsExplorer } from "@/components/locations/locations-explorer";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { STORE_LOCATIONS } from "@/data/locations";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, storeListSchema } from "@/lib/seo/schema";

export const metadata: Metadata = buildPageMetadata({
	title: "Lojas em Teresina, Timon e região",
	description:
		"Encontre a loja PlastLima mais próxima: 14 unidades no Piauí, Maranhão e Pernambuco com endereços, horários de funcionamento e contato por WhatsApp.",
	path: "/locations",
});

export default function LocationsPage() {
	return (
		<>
			<JsonLd
				data={[
					breadcrumbSchema([
						{ name: "Início", path: "/" },
						{ name: "Unidades", path: "/locations" },
					]),
					storeListSchema(),
				]}
			/>
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
