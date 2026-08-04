import type { LocationsContent } from "@plastlima-app/core/schemas";
import { STORE_LOCATIONS } from "@/data/locations";

/**
 * Unidades padrão — usadas quando o banco está fora, o documento não existe ou o
 * JSON não passa no schema (spec §7.1). São as mesmas lojas de sempre, agora
 * também servindo de rede de segurança.
 */
export const LOCATIONS_FALLBACK: LocationsContent = {
	stores: STORE_LOCATIONS,
};
