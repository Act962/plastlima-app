import { STORE_LOCATIONS } from "@/data/locations";
import { CONTACT, SITE, SOCIAL_LINKS } from "@/data/site";
import type { LocationState } from "@/types/location";

const ORGANIZATION_ID = `${SITE.url}/#organization`;
const WEBSITE_ID = `${SITE.url}/#website`;

const STATE_ABBREVIATION: Record<LocationState, string> = {
	Piauí: "PI",
	Maranhão: "MA",
	Pernambuco: "PE",
};

/** Extrai o número em formato E.164 a partir do link do WhatsApp (wa.me/55...). */
function toTelephone(whatsappUrl: string): string {
	const digits = whatsappUrl.replace(/\D/g, "");
	return `+${digits}`;
}

/** Dados da empresa — usado globalmente (rendeiza em todas as páginas). */
export function organizationSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		"@id": ORGANIZATION_ID,
		name: SITE.name,
		legalName: "PlastLima",
		url: SITE.url,
		logo: `${SITE.url}${SITE.logoUrl}`,
		image: `${SITE.url}/about/story-01.jpeg`,
		description: SITE.description,
		email: SITE.email,
		telephone: toTelephone(CONTACT.support.phone),
		foundingDate: "2002",
		address: {
			"@type": "PostalAddress",
			streetAddress: "Av. Henrry Wall de Carvalho — Angelim",
			addressLocality: "Teresina",
			addressRegion: "PI",
			postalCode: "64034-280",
			addressCountry: "BR",
		},
		areaServed: (Object.keys(STATE_ABBREVIATION) as LocationState[]).map(
			(state) => ({
				"@type": "State",
				name: state,
			}),
		),
		sameAs: SOCIAL_LINKS.map((social) => social.href),
	};
}

/** O site em si — habilita o nome do site na busca. */
export function websiteSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		"@id": WEBSITE_ID,
		url: SITE.url,
		name: SITE.name,
		inLanguage: "pt-BR",
		publisher: { "@id": ORGANIZATION_ID },
	};
}

/** Lista de lojas físicas — usado na página de unidades. */
export function storeListSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: "Unidades Plastlima",
		itemListElement: STORE_LOCATIONS.map((location, index) => ({
			"@type": "ListItem",
			position: index + 1,
			item: {
				"@type": "Store",
				name: `${SITE.name} — ${location.name}`,
				telephone: toTelephone(location.whatsappUrl),
				parentOrganization: { "@id": ORGANIZATION_ID },
				address: {
					"@type": "PostalAddress",
					addressLocality: location.city,
					addressRegion: STATE_ABBREVIATION[location.state],
					addressCountry: "BR",
				},
				...(location.instagramUrl ? { sameAs: [location.instagramUrl] } : {}),
			},
		})),
	};
}

/** Trilha de navegação (breadcrumb) para páginas internas. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: `${SITE.url}${item.path}`,
		})),
	};
}
