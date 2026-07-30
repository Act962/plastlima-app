/**
 * Paths of the one-off assets served from `apps/web/public`.
 * Collections that carry their own copy (banners, offers) live next to it in `home.ts`.
 */
export const IMAGES = {
	logo: "/logo.jpeg",
	company: {
		distributionCenter: "/company/distribution-center.png",
		warehouse: "/company/warehouse.png",
		franchiseBadge: "/company/franchise-badge.png",
	},
	about: {
		storefront: "/about/story-01.jpeg",
		warehouseOperation: "/about/story-02.jpeg",
	},
} as const;

export const DOCUMENTS = {
	catalogPdf: "/docs/catalogo-plastlima.pdf",
} as const;
