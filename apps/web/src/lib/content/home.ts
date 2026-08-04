import {
	contentCacheTag,
	GetDraft,
	GetPublishedContent,
} from "@plastlima-app/core";
import {
	type HomeContent,
	homeContentSchema,
} from "@plastlima-app/core/schemas";
import { getPrisma, PrismaContentRepository } from "@plastlima-app/infra";
import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { HOME_FALLBACK } from "@/data/fallback/home";

const HOME_TAG = contentCacheTag("home");

/**
 * Teto de espera pela leitura do banco. Com o Mongo fora, o timeout de seleção
 * de servidor do driver é de ~30s — tempo demais para uma página pública ficar
 * pendurada. Aqui a leitura é limitada a poucos segundos: passou disso, cai no
 * fallback na hora. É o que torna "banco fora não derruba o site" verdadeiro na
 * prática, não só no papel.
 */
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

/**
 * Lê o JSON publicado da home, cacheado sob a tag `content:home`.
 *
 * A tag é a mesma que o `PublishDocument` invalida ao publicar — por isso uma
 * publicação no admin reflete no site em segundos, sem rebuild. O `revalidate`
 * é uma rede de segurança do ISR: mesmo sem a chamada de invalidação, o dado se
 * renova periodicamente. A validação de shape fica **fora** do cache, para um
 * publicado inválido cair no fallback sem envenenar o cache.
 */
const readPublishedHome = unstable_cache(
	async () => {
		const repository = new PrismaContentRepository(getPrisma());
		const result = await new GetPublishedContent(repository).execute("home");

		if (!result.ok) {
			throw new Error(result.error.message);
		}

		return result.value;
	},
	["content", "home"],
	{ tags: [HOME_TAG], revalidate: 300 },
);

/**
 * Lê o rascunho da home, **sem cache**. Só roda em draft mode (preview), para o
 * editor ver o que ainda não publicou. Fora do preview isto nunca é chamado.
 */
async function readDraftHome(): Promise<HomeContent> {
	const repository = new PrismaContentRepository(getPrisma());
	const result = await new GetDraft(repository).execute("home");

	if (!result.ok) {
		return HOME_FALLBACK;
	}

	const parsed = homeContentSchema.safeParse(result.value.draft);
	return parsed.success ? parsed.data : HOME_FALLBACK;
}

/**
 * Conteúdo da home para a página renderizar. Nunca lança: banco fora, documento
 * inexistente ou JSON inválido caem no conteúdo de fallback, com o erro no log
 * (spec §7.1).
 *
 * Em draft mode (preview, spec §7.4) lê o rascunho sem cache; caso contrário, o
 * publicado cacheado. Consultar o `draftMode()` torna a home dinâmica, mas a
 * leitura do publicado continua cacheada — o banco não é tocado a cada request.
 */
export async function getHomeContent(): Promise<HomeContent> {
	try {
		const { isEnabled: isDraft } = await draftMode();

		if (isDraft) {
			return await withTimeout(readDraftHome(), READ_TIMEOUT_MS);
		}

		const published = await withTimeout(readPublishedHome(), READ_TIMEOUT_MS);

		if (published === null) {
			return HOME_FALLBACK;
		}

		const parsed = homeContentSchema.safeParse(published);

		if (!parsed.success) {
			console.error(
				"[content] 'home' publicado não passou no schema, usando fallback",
			);
			return HOME_FALLBACK;
		}

		return parsed.data;
	} catch (error) {
		console.error("[content] falha ao ler 'home', usando fallback", error);
		return HOME_FALLBACK;
	}
}
