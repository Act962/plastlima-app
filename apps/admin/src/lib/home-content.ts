import type { HomeContent } from "@plastlima-app/core/schemas";

/**
 * Conteúdo inicial da home, para o documento nascer preenchido no primeiro
 * acesso do painel.
 *
 * Espelha `apps/web/src/data/home.ts` de propósito e temporariamente: o admin
 * não depende do app público. Na Fase 4, quando os dados viram
 * `apps/web/src/data/fallback/`, esta cópia é substituída pela fonte única.
 */
export const HOME_SEED: HomeContent = {
	banners: [
		{
			src: "/banners/sorteio-kit-churrasco.jpeg",
			alt: "Sorteio mês dos pais: compre na Plastlima, cadastre-se e concorra a um Kit Churrasco com caixa térmica, grelha, garrafa térmica, tábua e facas. Sorteio em 31 de agosto.",
			href: "/sorteio",
			aspect: 1800 / 600,
			mobile: { src: "/banners/sorteio-popup.jpeg", aspect: 1080 / 1350 },
		},
		{
			src: "/banners/sorteio-como-participar.jpeg",
			alt: "Como participar do sorteio Kit Churrasco: realize uma compra, acesse plastlima.com.br, preencha o formulário e anexe o cupom de compra.",
			href: "/sorteio",
			aspect: 1800 / 600,
			mobile: {
				src: "/banners/sorteio-como-participar-mobile.jpeg",
				aspect: 1122 / 1402,
			},
		},
	],
	stats: [
		{ value: "23+", label: "anos de mercado" },
		{ value: "1.500+", label: "produtos no mix" },
		{ value: "14", label: "unidades em operação" },
		{ value: "3", label: "estados atendidos" },
	],
	offers: [
		{
			src: "/offers/offer-09.jpg",
			alt: "A embalagem certa faz toda diferença — embalagens Plastlima para seus produtos",
		},
		{
			src: "/offers/offer-10.jpg",
			alt: "Petisco no copo: copo PIC 040 com espetinho, ideal para mini degustações",
		},
		{
			src: "/offers/offer-11.jpg",
			alt: "A qualidade da embalagem define o retorno do seu cliente — Plastlima",
		},
	],
};
