import type { FranchiseContent } from "@plastlima-app/core/schemas";
import type { Metadata } from "next";
import { FranchiseEditor } from "@/components/franquias/franchise-editor";
import { requireActor } from "@/lib/auth-actor";
import { createGetDraft, createSaveDraft } from "@/lib/content";
import { FRANCHISE_SEED } from "@/lib/franchise-content";

export const metadata: Metadata = { title: "Franquias" };

const FRANCHISE_KEY = "franchise";

async function loadFranchise() {
	const actor = await requireActor();
	const getDraft = createGetDraft();

	let result = await getDraft.execute(FRANCHISE_KEY);

	if (!result.ok) {
		await createSaveDraft().execute({
			key: FRANCHISE_KEY,
			draft: FRANCHISE_SEED,
			actor,
		});
		result = await getDraft.execute(FRANCHISE_KEY);
	}

	if (!result.ok) {
		throw new Error("Não foi possível carregar a página de franquias.");
	}

	const document = result.value;
	const snapshot = document.toSnapshot();
	const state = document.publishState();

	return {
		draft: snapshot.draft as FranchiseContent,
		updatedAt: snapshot.updatedAt.toISOString(),
		stateLabel: state.label,
		canPublish: state.canPublish,
	};
}

export default async function FranquiasPage() {
	const { draft, updatedAt, stateLabel, canPublish } = await loadFranchise();

	return (
		<FranchiseEditor
			initialCanPublish={canPublish}
			initialFranchise={draft}
			initialStateLabel={stateLabel}
			initialUpdatedAt={updatedAt}
			key={updatedAt}
		/>
	);
}
