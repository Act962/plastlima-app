import type { HomeContent } from "@plastlima-app/core/schemas";
import { COMPANY_STATS, HERO_BANNERS, OFFER_HIGHLIGHTS } from "@/data/home";

/**
 * Conteúdo padrão da home — o que o site mostra quando o banco está fora, o
 * documento não existe ou o JSON publicado não passa no schema (spec §7.1).
 *
 * É a mesma verdade de sempre: as constantes de `data/home.ts` continuam sendo
 * o conteúdo do último deploy. Assim o site **nunca cai por causa do banco** —
 * no pior caso, renderiza isto.
 */
export const HOME_FALLBACK: HomeContent = {
	banners: HERO_BANNERS,
	stats: COMPANY_STATS,
	offers: OFFER_HIGHLIGHTS,
};
