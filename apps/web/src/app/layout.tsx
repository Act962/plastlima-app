import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Manrope } from "next/font/google";

import "../index.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsappFloatingButton } from "@/components/layout/whatsapp-floating-button";
import Providers from "@/components/providers";
import { RafflePopup } from "@/components/raffle/raffle-popup";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE } from "@/data/site";
import { getNavigation } from "@/lib/content/navigation";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/metadata";
import { organizationSchema, websiteSchema } from "@/lib/seo/schema";

const manrope = Manrope({
	variable: "--font-manrope",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

const archivo = Archivo({
	variable: "--font-archivo",
	subsets: ["latin"],
	weight: ["500", "600", "700", "800"],
});

const ibmPlexMono = IBM_Plex_Mono({
	variable: "--font-ibm-plex-mono",
	subsets: ["latin"],
	weight: ["400", "500"],
});

export const metadata: Metadata = {
	metadataBase: new URL(SITE.url),
	title: {
		default: `${SITE.name} — Descartáveis e embalagens no Piauí e Maranhão`,
		template: `%s | ${SITE.name}`,
	},
	description: SITE.description,
	applicationName: SITE.name,
	referrer: "origin-when-cross-origin",
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},
	openGraph: {
		type: "website",
		locale: "pt_BR",
		siteName: SITE.name,
		title: `${SITE.name} — Descartáveis e embalagens`,
		description: SITE.description,
		url: "/",
		images: [DEFAULT_OG_IMAGE],
	},
	twitter: {
		card: "summary_large_image",
		title: SITE.name,
		description: SITE.description,
		images: [DEFAULT_OG_IMAGE.url],
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { main: mainNav } = await getNavigation();

	return (
		<html
			className={`${manrope.variable} ${archivo.variable} ${ibmPlexMono.variable}`}
			lang="pt-BR"
		>
			<body>
				<JsonLd data={[organizationSchema(), websiteSchema()]} />
				<Providers>
					<div className="flex min-h-svh flex-col">
						<SiteHeader mainNav={mainNav} />
						<main className="flex-1">{children}</main>
						<SiteFooter />
					</div>
					<WhatsappFloatingButton />
					<RafflePopup />
				</Providers>
			</body>
		</html>
	);
}
