import type { Metadata } from "next";
import { SITE } from "@/data/site";

/** Imagem padrão de compartilhamento (OpenGraph / Twitter). */
export const DEFAULT_OG_IMAGE = {
	url: "/about/story-01.jpeg",
	width: 680,
	height: 510,
	alt: `${SITE.name} — descartáveis e embalagens`,
} as const;

type PageMetadataInput = {
	/** Título da aba; recebe o sufixo "| Plastlima" salvo quando `titleAbsolute`. */
	title: string;
	description: string;
	/** Caminho canônico, relativo à origem do site (ex.: "/about"). */
	path: string;
	/** Usa o título exatamente como informado, sem o sufixo da marca (home). */
	titleAbsolute?: boolean;
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
}: PageMetadataInput): Metadata {
	const socialTitle = titleAbsolute ? title : `${title} | ${SITE.name}`;

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
			images: [DEFAULT_OG_IMAGE],
		},
		twitter: {
			card: "summary_large_image",
			title: socialTitle,
			description,
			images: [DEFAULT_OG_IMAGE.url],
		},
	};
}
