import type { PrivacyPolicyContent } from "@plastlima-app/core/schemas";
import { PRIVACY_POLICY } from "@/data/privacy-policy";

/**
 * Política padrão — usada quando o banco está fora, o documento não existe ou o
 * JSON não passa no schema (spec §7.1). Reaproveita a constante existente (com os
 * dados do site já interpolados no código); como não há tokens, a renderização
 * apenas os repassa. O conteúdo publicado, esse sim, guarda os tokens.
 */
export const PRIVACY_POLICY_FALLBACK: PrivacyPolicyContent = PRIVACY_POLICY;
