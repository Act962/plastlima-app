import type { Metadata } from "next";
import { SITE } from "@/data/site";

/** Imagem padrão de compartilhamento (OpenGraph / Twitter). Proporção 1.91:1. */
export const DEFAULT_OG_IMAGE = {
	url: "/og-image.jpg",
	width: 1200,
	height: 630,
	alt: `${SITE.name} — a solução em descartáveis`,
} as const;

/** Imagem de compartilhamento de uma página específica. Proporção próxima de 1.91:1. */
export type OgImage = {
	url: string;
	width: number;
	height: number;
	alt: string;
};

type PageMetadataInput = {
	/** Título da aba; recebe o sufixo "| Plastlima" salvo quando `titleAbsolute`. */
	title: string;
	description: string;
	/** Caminho canônico, relativo à origem do site (ex.: "/about"). */
	path: string;
	/** Usa o título exatamente como informado, sem o sufixo da marca (home). */
	titleAbsolute?: boolean;
	/**
	 * Substitui a arte padrão de compartilhamento. Vale a pena em campanhas, que
	 * circulam por WhatsApp — a prévia genérica derruba o clique.
	 */
	image?: OgImage;
};

/**
 * Monta o objeto Metadata de uma página a partir de poucos campos, garantindo
 * canonical, OpenGraph e Twitter Card consistentes em todas as rotas.
 * `metadataBase` (definido no layout) resolve os caminhos relativos.
 */
export function buildPageMetadata({
	title,
	description,
	path,
	titleAbsolute = false,
	image,
}: PageMetadataInput): Metadata {
	const socialTitle = titleAbsolute ? title : `${title} | ${SITE.name}`;
	const ogImage: OgImage = image ?? DEFAULT_OG_IMAGE;

	return {
		title: titleAbsolute ? { absolute: title } : title,
		description,
		alternates: { canonical: path },
		openGraph: {
			type: "website",
			locale: "pt_BR",
			siteName: SITE.name,
			title: socialTitle,
			description,
			url: path,
			images: [ogImage],
		},
		twitter: {
			card: "summary_large_image",
			title: socialTitle,
			description,
			images: [ogImage.url],
		},
	};
}
