import type { NavigationContent } from "@plastlima-app/core/schemas";
import { LEGAL_ITEMS, NAV_ITEMS } from "@/data/navigation";

/**
 * Rótulos padrão do menu — usados quando o banco está fora, o documento não
 * existe ou o JSON não passa no schema (spec §7.1). São os mesmos itens de
 * sempre; os `href` continuam vindo daqui (rotas fixas), o banco só troca texto.
 */
export const NAVIGATION_FALLBACK: NavigationContent = {
	main: NAV_ITEMS.map((item) => ({ href: item.href, label: item.label })),
	legal: LEGAL_ITEMS.map((item) => ({ href: item.href, label: item.label })),
};
