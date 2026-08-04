import {
	contentCacheTag,
	GetDraft,
	GetPublishedContent,
} from "@plastlima-app/core";
import {
	type AboutContent,
	aboutContentSchema,
} from "@plastlima-app/core/schemas";
import { getPrisma, PrismaContentRepository } from "@plastlima-app/infra";
import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { ABOUT_FALLBACK } from "@/data/fallback/about";

const ABOUT_TAG = contentCacheTag("about");
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

const readPublishedAbout = unstable_cache(
	async () => {
		const repository = new PrismaContentRepository(getPrisma());
		const result = await new GetPublishedContent(repository).execute("about");

		if (!result.ok) {
			throw new Error(result.error.message);
		}

		return result.value;
	},
	["content", "about"],
	{ tags: [ABOUT_TAG], revalidate: 300 },
);

async function readDraftAbout(): Promise<AboutContent> {
	const repository = new PrismaContentRepository(getPrisma());
	const result = await new GetDraft(repository).execute("about");

	if (!result.ok) {
		return ABOUT_FALLBACK;
	}

	const parsed = aboutContentSchema.safeParse(result.value.draft);
	return parsed.success ? parsed.data : ABOUT_FALLBACK;
}

/**
 * Conteúdo da página Sobre. Nunca lança: qualquer falha cai no fallback em
 * código (spec §7.1). Em draft mode lê o rascunho, para o preview funcionar.
 */
export async function getAboutContent(): Promise<AboutContent> {
	try {
		const { isEnabled: isDraft } = await draftMode();

		if (isDraft) {
			return await withTimeout(readDraftAbout(), READ_TIMEOUT_MS);
		}

		const published = await withTimeout(readPublishedAbout(), READ_TIMEOUT_MS);

		if (published === null) {
			return ABOUT_FALLBACK;
		}

		const parsed = aboutContentSchema.safeParse(published);

		if (!parsed.success) {
			console.error(
				"[content] 'about' publicado não passou no schema, usando fallback",
			);
			return ABOUT_FALLBACK;
		}

		return parsed.data;
	} catch (error) {
		console.error("[content] falha ao ler 'about', usando fallback", error);
		return ABOUT_FALLBACK;
	}
}
