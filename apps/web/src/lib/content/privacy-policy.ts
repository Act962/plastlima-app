import {
	contentCacheTag,
	GetDraft,
	GetPublishedContent,
} from "@plastlima-app/core";
import {
	type PrivacyPolicyContent,
	privacyPolicyContentSchema,
} from "@plastlima-app/core/schemas";
import { getPrisma, PrismaContentRepository } from "@plastlima-app/infra";
import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { PRIVACY_POLICY_FALLBACK } from "@/data/fallback/privacy-policy";

const PRIVACY_POLICY_TAG = contentCacheTag("privacy-policy");
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

const readPublishedPrivacyPolicy = unstable_cache(
	async () => {
		const repository = new PrismaContentRepository(getPrisma());
		const result = await new GetPublishedContent(repository).execute(
			"privacy-policy",
		);

		if (!result.ok) {
			throw new Error(result.error.message);
		}

		return result.value;
	},
	["content", "privacy-policy"],
	{ tags: [PRIVACY_POLICY_TAG], revalidate: 300 },
);

async function readDraftPrivacyPolicy(): Promise<PrivacyPolicyContent> {
	const repository = new PrismaContentRepository(getPrisma());
	const result = await new GetDraft(repository).execute("privacy-policy");

	if (!result.ok) {
		return PRIVACY_POLICY_FALLBACK;
	}

	const parsed = privacyPolicyContentSchema.safeParse(result.value.draft);
	return parsed.success ? parsed.data : PRIVACY_POLICY_FALLBACK;
}

/**
 * Política de Privacidade (com os tokens ainda no texto — a página resolve com
 * os dados do `site`). Nunca lança: qualquer falha cai no fallback em código
 * (spec §7.1). Em draft mode lê o rascunho, para o preview funcionar.
 */
export async function getPrivacyPolicyContent(): Promise<PrivacyPolicyContent> {
	try {
		const { isEnabled: isDraft } = await draftMode();

		if (isDraft) {
			return await withTimeout(readDraftPrivacyPolicy(), READ_TIMEOUT_MS);
		}

		const published = await withTimeout(
			readPublishedPrivacyPolicy(),
			READ_TIMEOUT_MS,
		);

		if (published === null) {
			return PRIVACY_POLICY_FALLBACK;
		}

		const parsed = privacyPolicyContentSchema.safeParse(published);

		if (!parsed.success) {
			console.error(
				"[content] 'privacy-policy' publicado não passou no schema, usando fallback",
			);
			return PRIVACY_POLICY_FALLBACK;
		}

		return parsed.data;
	} catch (error) {
		console.error(
			"[content] falha ao ler 'privacy-policy', usando fallback",
			error,
		);
		return PRIVACY_POLICY_FALLBACK;
	}
}
