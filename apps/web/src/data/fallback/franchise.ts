import type { FranchiseContent } from "@plastlima-app/core/schemas";
import {
	COMPANY_TIMELINE,
	FRANCHISE_ABOUT_PARAGRAPHS,
	MARKET_DATA_IMAGES,
	SERVED_SEGMENTS,
} from "@/data/franchise";

/**
 * Conteúdo padrão da página de franquias — usado quando o banco está fora, o
 * documento não existe ou o JSON não passa no schema (spec §7.1). São as mesmas
 * constantes de sempre, agora também servindo de rede de segurança.
 */
export const FRANCHISE_FALLBACK: FranchiseContent = {
	timeline: COMPANY_TIMELINE,
	segments: SERVED_SEGMENTS,
	about: FRANCHISE_ABOUT_PARAGRAPHS,
	marketImages: MARKET_DATA_IMAGES,
};
