import type { NavigationContent } from "@plastlima-app/core/schemas";

/**
 * Rótulos iniciais do menu, para o documento nascer completo no primeiro acesso.
 * Espelha `apps/web/src/data/navigation.ts` (temporário, como os demais seeds).
 * Os `href` aqui são só referência: o site os mantém em código e casa pelo href.
 */
export const NAVIGATION_SEED: NavigationContent = {
	main: [
		{ href: "/", label: "Início" },
		{ href: "/sobre", label: "Sobre nós" },
		{ href: "/unidades", label: "Unidades" },
		{ href: "/franquias", label: "Seja um franqueado" },
		{ href: "/contato", label: "Contato" },
	],
	legal: [
		{ href: "/politica-de-privacidade", label: "Política de Privacidade" },
	],
};
