import { contentCacheTag, GetPublishedContent } from "@plastlima-app/core";
import {
	type SiteContent,
	siteContentSchema,
} from "@plastlima-app/core/schemas";
import { getPrisma, PrismaContentRepository } from "@plastlima-app/infra";
import { unstable_cache } from "next/cache";
import { SITE_FALLBACK } from "@/data/fallback/site";

const SITE_TAG = contentCacheTag("site");
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

const readPublishedSite = unstable_cache(
	async () => {
		const repository = new PrismaContentRepository(getPrisma());
		const result = await new GetPublishedContent(repository).execute("site");

		if (!result.ok) {
			throw new Error(result.error.message);
		}

		return result.value;
	},
	["content", "site"],
	{ tags: [SITE_TAG], revalidate: 300 },
);

/**
 * Configurações do site (nome, contatos, social, copyright…) para o layout
 * renderizar. Nunca lança: qualquer falha cai no fallback em código, mantendo o
 * cabeçalho/rodapé no ar (spec §7.1).
 *
 * Sem checagem de draft mode aqui de propósito: o rodapé está no layout de todas
 * as páginas, e consultar `draftMode()` aqui poderia tirá-las do modo estático.
 * O preview de configurações fica para depois.
 */
export async function getSiteContent(): Promise<SiteContent> {
	try {
		const published = await withTimeout(readPublishedSite(), READ_TIMEOUT_MS);

		if (published === null) {
			return SITE_FALLBACK;
		}

		const parsed = siteContentSchema.safeParse(published);

		if (!parsed.success) {
			console.error(
				"[content] 'site' publicado não passou no schema, usando fallback",
			);
			return SITE_FALLBACK;
		}

		return parsed.data;
	} catch (error) {
		console.error("[content] falha ao ler 'site', usando fallback", error);
		return SITE_FALLBACK;
	}
}
