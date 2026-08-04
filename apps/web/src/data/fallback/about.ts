import type { AboutContent } from "@plastlima-app/core/schemas";
import { ABOUT_STORY, ABOUT_SUMMARY, WELCOME_MESSAGE } from "@/data/about";

/**
 * Conteúdo padrão da página Sobre — usado quando o banco está fora, o documento
 * não existe ou o JSON não passa no schema (spec §7.1). São as mesmas constantes
 * de sempre, agora também servindo de rede de segurança.
 */
export const ABOUT_FALLBACK: AboutContent = {
	story: ABOUT_STORY,
	summary: ABOUT_SUMMARY,
	welcome: WELCOME_MESSAGE,
};
