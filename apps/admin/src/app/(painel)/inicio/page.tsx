import type { HomeContent } from "@plastlima-app/core/schemas";
import type { Metadata } from "next";
import { HomeEditor } from "@/components/inicio/home-editor";
import { requireActor } from "@/lib/auth-actor";
import { createGetDraft, createSaveDraft } from "@/lib/content";
import { HOME_SEED } from "@/lib/home-content";

export const metadata: Metadata = { title: "Início" };

const HOME_KEY = "home";

/**
 * Carrega o documento da home para edição. No primeiro acesso o documento ainda
 * não existe — então nasce a partir do conteúdo atual do site (`HOME_SEED`), o
 * que dá ao editor banners reais para trocar já de cara.
 */
async function loadHome() {
	const actor = await requireActor();
	const getDraft = createGetDraft();

	let result = await getDraft.execute(HOME_KEY);

	if (!result.ok) {
		await createSaveDraft().execute({
			key: HOME_KEY,
			draft: HOME_SEED,
			actor,
		});
		result = await getDraft.execute(HOME_KEY);
	}

	if (!result.ok) {
		throw new Error("Não foi possível carregar o documento da home.");
	}

	const document = result.value;
	const snapshot = document.toSnapshot();
	const state = document.publishState();

	return {
		draft: snapshot.draft as HomeContent,
		updatedAt: snapshot.updatedAt.toISOString(),
		stateLabel: state.label,
		canPublish: state.canPublish,
	};
}

export default async function InicioPage() {
	const { draft, updatedAt, stateLabel, canPublish } = await loadHome();

	return (
		<HomeEditor
			// Remonta o editor quando o conteúdo do servidor muda (ex.: após uma
			// restauração via router.refresh()), reiniciando o estado local a partir
			// do documento restaurado.
			initialCanPublish={canPublish}
			initialHome={draft}
			initialStateLabel={stateLabel}
			initialUpdatedAt={updatedAt}
			key={updatedAt}
		/>
	);
}
