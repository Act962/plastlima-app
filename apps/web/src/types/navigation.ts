import type { Route } from "next";

export type NavItem = {
	label: string;
	href: Route;
};

export type ExternalLink = {
	label: string;
	href: string;
};

export type SocialPlatform = "facebook" | "instagram" | "whatsapp";

export type SocialLink = ExternalLink & {
	platform: SocialPlatform;
};
