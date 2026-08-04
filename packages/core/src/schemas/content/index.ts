import type { ZodType } from "zod";
import type { ContentKeyValue } from "../../domain/content/value-objects/content-key";
import { aboutContentSchema } from "./about";
import { homeContentSchema } from "./home";
import { locationsContentSchema } from "./locations";
import { siteContentSchema } from "./site";

/** Um schema de documento e a versão de formato que ele representa. */
export type ContentSchemaEntry = {
	schema: ZodType;
	version: number;
};

/**
 * Registro de schemas por `key` — a fonte da verdade do formato de cada
 * documento. `home` e `site` modelados; os demais entram conforme a fatia
 * vertical do piloto for replicada (spec §12, fase 5).
 */
export const CONTENT_SCHEMAS: Partial<
	Record<ContentKeyValue, ContentSchemaEntry>
> = {
	home: { schema: homeContentSchema, version: 1 },
	site: { schema: siteContentSchema, version: 1 },
	about: { schema: aboutContentSchema, version: 1 },
	locations: { schema: locationsContentSchema, version: 1 },
};

export function getContentSchema(
	key: ContentKeyValue,
): ContentSchemaEntry | undefined {
	return CONTENT_SCHEMAS[key];
}

export {
	type AboutContent,
	type AboutRichTextSegment,
	type AboutStoryBlock,
	aboutContentSchema,
	storyBlockSchema,
} from "./about";
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
export {
	LOCATION_STATES,
	type LocationStateValue,
	type LocationsContent,
	locationStateSchema,
	locationsContentSchema,
	type OpeningHoursContent,
	openingHoursSchema,
	type StoreLocationContent,
	storeLocationSchema,
} from "./locations";
export { markdownToSegments, segmentsToMarkdown } from "./rich-text";
export {
	type SiteContent,
	type SiteSocialLink,
	siteContentSchema,
} from "./site";
