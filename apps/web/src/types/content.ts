import type { Route } from "next";

/** A run of text that may be emphasised, so copy stays data instead of markup. */
export type RichTextSegment = string | { text: string; emphasis: true };

export type Stat = {
	value: string;
	label: string;
};

export type TimelineEntry = {
	year: string;
	description: string;
};

export type MediaItem = {
	src: string;
	alt: string;
	/** Destino ao clicar. Sem isso a imagem é apenas ilustrativa. */
	href?: Route;
};

export type HeroBanner = MediaItem & {
	/**
	 * Proporção da arte (largura ÷ altura). A faixa do carrossel adota essa
	 * proporção, então a imagem aparece inteira e sem moldura em volta.
	 * Sem isso, a faixa cai no padrão de 1,92:1.
	 */
	aspect?: number;
	/**
	 * Arte alternativa para telas estreitas, com a proporção dela. Sem isso, o
	 * celular recebe a arte padrão. A proporção é obrigatória aqui porque é ela
	 * que dá a altura da faixa no celular.
	 */
	mobile?: { src: string; aspect: number };
};
