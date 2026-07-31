import type { MetadataRoute } from "next";
import { LEGAL_ITEMS, NAV_ITEMS } from "@/data/navigation";
import { SITE } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date();

	const mainRoutes: MetadataRoute.Sitemap = NAV_ITEMS.map((item) => {
		const isHome = item.href === "/";

		return {
			url: `${SITE.url}${isHome ? "" : item.href}`,
			lastModified,
			changeFrequency: isHome ? "weekly" : "monthly",
			priority: isHome ? 1 : 0.8,
		};
	});

	const legalRoutes: MetadataRoute.Sitemap = LEGAL_ITEMS.map((item) => ({
		url: `${SITE.url}${item.href}`,
		lastModified,
		changeFrequency: "yearly",
		priority: 0.3,
	}));

	/**
	 * Rotas de campanha. Ficam fora de NAV_ITEMS de propósito — são temporárias e
	 * não devem entrar no menu — mas precisam ser indexadas enquanto no ar.
	 * Ao encerrar a campanha, remova a entrada daqui junto com a página.
	 */
	const campaignRoutes: MetadataRoute.Sitemap = [
		{
			url: `${SITE.url}/sorteio`,
			lastModified,
			changeFrequency: "daily",
			priority: 0.9,
		},
		{
			url: `${SITE.url}/sorteio/regulamento`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.2,
		},
	];

	return [...mainRoutes, ...legalRoutes, ...campaignRoutes];
}
