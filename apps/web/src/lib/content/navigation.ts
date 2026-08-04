import { contentCacheTag, GetPublishedContent } from "@plastlima-app/core";
import {
	type NavigationContent,
	navigationContentSchema,
} from "@plastlima-app/core/schemas";
import { getPrisma, PrismaContentRepository } from "@plastlima-app/infra";
import { unstable_cache } from "next/cache";
import { NAVIGATION_FALLBACK } from "@/data/fallback/navigation";
import { LEGAL_ITEMS, NAV_ITEMS } from "@/data/navigation";
import type { NavItem } from "@/types/navigation";

const NAVIGATION_TAG = contentCacheTag("navigation");
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

const readPublishedNavigation = unstable_cache(
	async () => {
		const repository = new PrismaContentRepository(getPrisma());
		const result = await new GetPublishedContent(repository).execute(
			"navigation",
		);

		if (!result.ok) {
			throw new Error(result.error.message);
		}

		return result.value;
	},
	["content", "navigation"],
	{ tags: [NAVIGATION_TAG], revalidate: 300 },
);

async function readNavigation(): Promise<NavigationContent> {
	try {
		const published = await withTimeout(
			readPublishedNavigation(),
			READ_TIMEOUT_MS,
		);

		if (published === null) {
			return NAVIGATION_FALLBACK;
		}

		const parsed = navigationContentSchema.safeParse(published);

		if (!parsed.success) {
			console.error(
				"[content] 'navigation' publicado não passou no schema, usando fallback",
			);
			return NAVIGATION_FALLBACK;
		}

		return parsed.data;
	} catch (error) {
		console.error(
			"[content] falha ao ler 'navigation', usando fallback",
			error,
		);
		return NAVIGATION_FALLBACK;
	}
}

/**
 * Casa cada rota fixa com o rótulo salvo no banco. O `href` vem SEMPRE do código
 * (mantém a tipagem `Route` e a garantia de rota real); o banco só fornece o
 * texto. Rótulo vazio ou rota sem correspondência cai no rótulo padrão.
 */
function resolve(fixed: NavItem[], stored: { href: string; label: string }[]) {
	return fixed.map((item): NavItem => {
		const match = stored.find((entry) => entry.href === item.href);
		const label = match?.label.trim() ? match.label : item.label;
		return { href: item.href, label };
	});
}

/**
 * Rótulos do menu para o cabeçalho, o rodapé e o menu mobile. Nunca lança: sem
 * draft mode de propósito (vive no layout de todas as páginas; consultar
 * `draftMode()` aqui poderia tirá-las do modo estático), igual ao `getSiteContent`.
 */
export async function getNavigation(): Promise<{
	main: NavItem[];
	legal: NavItem[];
}> {
	const content = await readNavigation();

	return {
		main: resolve(NAV_ITEMS, content.main),
		legal: resolve(LEGAL_ITEMS, content.legal),
	};
}
