import type { AboutContent } from "@plastlima-app/core/schemas";
import type { Metadata } from "next";
import { AboutEditor } from "@/components/about/about-editor";
import { ABOUT_SEED } from "@/lib/about-content";
import { requireActor } from "@/lib/auth-actor";
import { createGetDraft, createSaveDraft } from "@/lib/content";

export const metadata: Metadata = { title: "Sobre" };

const ABOUT_KEY = "about";

async function loadAbout() {
	const actor = await requireActor();
	const getDraft = createGetDraft();

	let result = await getDraft.execute(ABOUT_KEY);

	if (!result.ok) {
		await createSaveDraft().execute({
			key: ABOUT_KEY,
			draft: ABOUT_SEED,
			actor,
		});
		result = await getDraft.execute(ABOUT_KEY);
	}

	if (!result.ok) {
		throw new Error("Não foi possível carregar a página Sobre.");
	}

	const document = result.value;
	const snapshot = document.toSnapshot();
	const state = document.publishState();

	return {
		draft: snapshot.draft as AboutContent,
		updatedAt: snapshot.updatedAt.toISOString(),
		stateLabel: state.label,
		canPublish: state.canPublish,
	};
}

export default async function SobrePage() {
	const { draft, updatedAt, stateLabel, canPublish } = await loadAbout();

	return (
		<AboutEditor
			initialAbout={draft}
			initialCanPublish={canPublish}
			initialStateLabel={stateLabel}
			initialUpdatedAt={updatedAt}
			key={updatedAt}
		/>
	);
}
