import { z } from "zod";

/**
 * Schema do documento `locations` — as unidades físicas da rede.
 *
 * Espelha `apps/web/src/data/locations.ts` (`STORE_LOCATIONS`) e o tipo
 * `apps/web/src/types/location.ts`. É a decisão de projeto da spec §5: as ~14
 * lojas são UM documento (um array), não uma coleção — assim publicação,
 * histórico e rollback funcionam igual aos demais documentos, sem infra extra.
 */

const nonEmpty = (field: string) =>
	z.string().trim().min(1, `${field} é obrigatório.`);

const url = (field: string) =>
	z.string().trim().url(`${field} precisa ser uma URL válida.`);

/** Os estados onde há loja hoje. Novo estado entra aqui e no site juntos. */
export const LOCATION_STATES = ["Piauí", "Maranhão", "Pernambuco"] as const;

export const locationStateSchema = z.enum(LOCATION_STATES, {
	message: "Selecione um estado válido.",
});

/** Uma faixa de horário: os dias e o intervalo, ambos texto livre. */
export const openingHoursSchema = z.object({
	days: nonEmpty("Os dias"),
	time: nonEmpty("O horário"),
});

/**
 * Uma loja. `instagramUrl` é opcional (nem toda unidade tem perfil); o resto é
 * obrigatório porque o card e o JSON-LD do site dependem disso.
 */
export const storeLocationSchema = z.object({
	id: nonEmpty("O id da loja"),
	name: nonEmpty("O nome da loja"),
	state: locationStateSchema,
	city: nonEmpty("A cidade"),
	phone: nonEmpty("O telefone"),
	whatsappUrl: url("O link do WhatsApp"),
	instagramUrl: url("O link do Instagram").optional(),
	mapEmbedUrl: url("O mapa"),
	hours: z
		.array(openingHoursSchema)
		.min(1, "Informe ao menos uma faixa de horário."),
});

export const locationsContentSchema = z.object({
	stores: z
		.array(storeLocationSchema)
		.min(1, "É preciso ao menos uma unidade."),
});

export type LocationsContent = z.infer<typeof locationsContentSchema>;
export type StoreLocationContent = z.infer<typeof storeLocationSchema>;
export type OpeningHoursContent = z.infer<typeof openingHoursSchema>;
export type LocationStateValue = z.infer<typeof locationStateSchema>;
