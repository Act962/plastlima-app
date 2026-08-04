import {
	contentCacheTag,
	GetDraft,
	GetPublishedContent,
} from "@plastlima-app/core";
import {
	type FranchiseContent,
	franchiseContentSchema,
} from "@plastlima-app/core/schemas";
import { getPrisma, PrismaContentRepository } from "@plastlima-app/infra";
import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { FRANCHISE_FALLBACK } from "@/data/fallback/franchise";

const FRANCHISE_TAG = contentCacheTag("franchise");
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

const readPublishedFranchise = unstable_cache(
	async () => {
		const repository = new PrismaContentRepository(getPrisma());
		const result = await new GetPublishedContent(repository).execute(
			"franchise",
		);

		if (!result.ok) {
			throw new Error(result.error.message);
		}

		return result.value;
	},
	["content", "franchise"],
	{ tags: [FRANCHISE_TAG], revalidate: 300 },
);

async function readDraftFranchise(): Promise<FranchiseContent> {
	const repository = new PrismaContentRepository(getPrisma());
	const result = await new GetDraft(repository).execute("franchise");

	if (!result.ok) {
		return FRANCHISE_FALLBACK;
	}

	const parsed = franchiseContentSchema.safeParse(result.value.draft);
	return parsed.success ? parsed.data : FRANCHISE_FALLBACK;
}

/**
 * Conteúdo da página de franquias. Nunca lança: qualquer falha cai no fallback
 * em código (spec §7.1). Em draft mode lê o rascunho, para o preview funcionar.
 */
export async function getFranchiseContent(): Promise<FranchiseContent> {
	try {
		const { isEnabled: isDraft } = await draftMode();

		if (isDraft) {
			return await withTimeout(readDraftFranchise(), READ_TIMEOUT_MS);
		}

		const published = await withTimeout(
			readPublishedFranchise(),
			READ_TIMEOUT_MS,
		);

		if (published === null) {
			return FRANCHISE_FALLBACK;
		}

		const parsed = franchiseContentSchema.safeParse(published);

		if (!parsed.success) {
			console.error(
				"[content] 'franchise' publicado não passou no schema, usando fallback",
			);
			return FRANCHISE_FALLBACK;
		}

		return parsed.data;
	} catch (error) {
		console.error("[content] falha ao ler 'franchise', usando fallback", error);
		return FRANCHISE_FALLBACK;
	}
}
