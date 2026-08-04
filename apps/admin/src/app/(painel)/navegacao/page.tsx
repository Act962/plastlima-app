import type { NavigationContent } from "@plastlima-app/core/schemas";
import type { Metadata } from "next";
import { NavigationEditor } from "@/components/navegacao/navigation-editor";
import { requireActor } from "@/lib/auth-actor";
import { createGetDraft, createSaveDraft } from "@/lib/content";
import { NAVIGATION_SEED } from "@/lib/navigation-content";

export const metadata: Metadata = { title: "Navegação" };

const NAVIGATION_KEY = "navigation";

async function loadNavigation() {
	const actor = await requireActor();
	const getDraft = createGetDraft();

	let result = await getDraft.execute(NAVIGATION_KEY);

	if (!result.ok) {
		await createSaveDraft().execute({
			key: NAVIGATION_KEY,
			draft: NAVIGATION_SEED,
			actor,
		});
		result = await getDraft.execute(NAVIGATION_KEY);
	}

	if (!result.ok) {
		throw new Error("Não foi possível carregar a navegação.");
	}

	const document = result.value;
	const snapshot = document.toSnapshot();
	const state = document.publishState();

	return {
		draft: snapshot.draft as NavigationContent,
		updatedAt: snapshot.updatedAt.toISOString(),
		stateLabel: state.label,
		canPublish: state.canPublish,
	};
}

export default async function NavegacaoPage() {
	const { draft, updatedAt, stateLabel, canPublish } = await loadNavigation();

	return (
		<NavigationEditor
			initialCanPublish={canPublish}
			initialNavigation={draft}
			initialStateLabel={stateLabel}
			initialUpdatedAt={updatedAt}
			key={updatedAt}
		/>
	);
}
