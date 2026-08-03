import type { ZodType } from "zod";
import type { ContentKeyValue } from "../../domain/content/value-objects/content-key";
import { homeContentSchema } from "./home";

/** Um schema de documento e a versão de formato que ele representa. */
export type ContentSchemaEntry = {
	schema: ZodType;
	version: number;
};

/**
 * Registro de schemas por `key` — a fonte da verdade do formato de cada
 * documento. Só `home` está modelado nesta fase; os outros seis entram conforme
 * a fatia vertical do piloto for replicada (spec §12, fase 5).
 */
export const CONTENT_SCHEMAS: Partial<
	Record<ContentKeyValue, ContentSchemaEntry>
> = {
	home: { schema: homeContentSchema, version: 1 },
};

export function getContentSchema(
	key: ContentKeyValue,
): ContentSchemaEntry | undefined {
	return CONTENT_SCHEMAS[key];
}

export {
	type HeroBannerContent,
	type HomeContent,
	heroBannerSchema,
	homeContentSchema,
	type MediaItemContent,
	mediaItemSchema,
	type StatContent,
	statSchema,
} from "./home";
