import type { Actor } from "../../domain/shared/actor";
import type { JsonValue } from "../../domain/shared/json";

/** Ator de teste — quem edita e publica no painel. */
export const EDITOR: Actor = {
	id: "user-1",
	email: "joao@plastlima.com.br",
};

/** Conteúdo de `home` que passa no `homeContentSchema`. */
export const VALID_HOME: JsonValue = {
	banners: [{ src: "/banners/a.jpeg", alt: "Banner de campanha", aspect: 3 }],
	stats: [{ value: "23+", label: "anos de mercado" }],
	offers: [{ src: "/offers/1.jpg", alt: "Oferta em destaque" }],
};

/** Mesmo conteúdo, com um banner a mais — para gerar diferença ao publicar. */
export const VALID_HOME_EDITED: JsonValue = {
	banners: [
		{ src: "/banners/a.jpeg", alt: "Banner de campanha", aspect: 3 },
		{ src: "/banners/b.jpeg", alt: "Segundo banner", aspect: 3 },
	],
	stats: [{ value: "23+", label: "anos de mercado" }],
	offers: [{ src: "/offers/1.jpg", alt: "Oferta em destaque" }],
};

/** `alt` vazio quebra o schema — usado para a invariante 1. */
export const INVALID_HOME: JsonValue = {
	banners: [{ src: "/banners/a.jpeg", alt: "" }],
	stats: [],
	offers: [],
};
