import type { MetadataRoute } from "next";
import { NAV_ITEMS } from "@/data/navigation";
import { SITE } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date();

	return NAV_ITEMS.map((item) => {
		const isHome = item.href === "/";

		return {
			url: `${SITE.url}${isHome ? "" : item.href}`,
			lastModified,
			changeFrequency: isHome ? "weekly" : "monthly",
			priority: isHome ? 1 : 0.8,
		};
	});
}
