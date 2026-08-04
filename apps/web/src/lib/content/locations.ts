import {
	contentCacheTag,
	GetDraft,
	GetPublishedContent,
} from "@plastlima-app/core";
import {
	type LocationsContent,
	locationsContentSchema,
} from "@plastlima-app/core/schemas";
import { getPrisma, PrismaContentRepository } from "@plastlima-app/infra";
import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { LOCATIONS_FALLBACK } from "@/data/fallback/locations";

const LOCATIONS_TAG = contentCacheTag("locations");
const READ_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	let timer: ReturnType<typeof setTimeout>;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(
			() => reject(new Error(`leitura de conteúdo excedeu ${ms}ms`)),
			ms,
		);
	});

	return Promise.race([promise.finally(() => clearTimeout(timer)), timeout]);
}

const readPublishedLocations = unstable_cache(
	async () => {
		const repository = new PrismaContentRepository(getPrisma());
		const result = await new GetPublishedContent(repository).execute(
			"locations",
		);

		if (!result.ok) {
			throw new Error(result.error.message);
		}

		return result.value;
	},
	["content", "locations"],
	{ tags: [LOCATIONS_TAG], revalidate: 300 },
);

async function readDraftLocations(): Promise<LocationsContent> {
	const repository = new PrismaContentRepository(getPrisma());
	const result = await new GetDraft(repository).execute("locations");

	if (!result.ok) {
		return LOCATIONS_FALLBACK;
	}

	const parsed = locationsContentSchema.safeParse(result.value.draft);
	return parsed.success ? parsed.data : LOCATIONS_FALLBACK;
}

/**
 * As unidades físicas. Nunca lança: qualquer falha cai no fallback em código
 * (spec §7.1). Em draft mode lê o rascunho, para o preview funcionar.
 */
export async function getLocationsContent(): Promise<LocationsContent> {
	try {
		const { isEnabled: isDraft } = await draftMode();

		if (isDraft) {
			return await withTimeout(readDraftLocations(), READ_TIMEOUT_MS);
		}

		const published = await withTimeout(
			readPublishedLocations(),
			READ_TIMEOUT_MS,
		);

		if (published === null) {
			return LOCATIONS_FALLBACK;
		}

		const parsed = locationsContentSchema.safeParse(published);

		if (!parsed.success) {
			console.error(
				"[content] 'locations' publicado não passou no schema, usando fallback",
			);
			return LOCATIONS_FALLBACK;
		}

		return parsed.data;
	} catch (error) {
		console.error("[content] falha ao ler 'locations', usando fallback", error);
		return LOCATIONS_FALLBACK;
	}
}
