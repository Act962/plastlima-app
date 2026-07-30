import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Manrope } from "next/font/google";

import "../index.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsappFloatingButton } from "@/components/layout/whatsapp-floating-button";
import Providers from "@/components/providers";
import { SITE } from "@/data/site";

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
	title: {
		default: `${SITE.name} — Descartáveis e embalagens`,
		template: `%s | ${SITE.name}`,
	},
	description: SITE.description,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			className={`${manrope.variable} ${archivo.variable} ${ibmPlexMono.variable}`}
			lang="pt-BR"
		>
			<body>
				<Providers>
					<div className="flex min-h-svh flex-col">
						<SiteHeader />
						<main className="flex-1">{children}</main>
						<SiteFooter />
					</div>
					<WhatsappFloatingButton />
				</Providers>
			</body>
		</html>
	);
}
