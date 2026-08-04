import type { PrivacyPolicyContent } from "@plastlima-app/core/schemas";
import type { Metadata } from "next";
import { PrivacyPolicyEditor } from "@/components/politica/privacy-policy-editor";
import { requireActor } from "@/lib/auth-actor";
import { createGetDraft, createSaveDraft } from "@/lib/content";
import { PRIVACY_POLICY_SEED } from "@/lib/privacy-policy-content";

export const metadata: Metadata = { title: "Política de Privacidade" };

const PRIVACY_POLICY_KEY = "privacy-policy";

async function loadPrivacyPolicy() {
	const actor = await requireActor();
	const getDraft = createGetDraft();

	let result = await getDraft.execute(PRIVACY_POLICY_KEY);

	if (!result.ok) {
		await createSaveDraft().execute({
			key: PRIVACY_POLICY_KEY,
			draft: PRIVACY_POLICY_SEED,
			actor,
		});
		result = await getDraft.execute(PRIVACY_POLICY_KEY);
	}

	if (!result.ok) {
		throw new Error("Não foi possível carregar a política de privacidade.");
	}

	const document = result.value;
	const snapshot = document.toSnapshot();
	const state = document.publishState();

	return {
		draft: snapshot.draft as PrivacyPolicyContent,
		updatedAt: snapshot.updatedAt.toISOString(),
		stateLabel: state.label,
		canPublish: state.canPublish,
	};
}

export default async function PoliticaPage() {
	const { draft, updatedAt, stateLabel, canPublish } =
		await loadPrivacyPolicy();

	return (
		<PrivacyPolicyEditor
			initialCanPublish={canPublish}
			initialPolicy={draft}
			initialStateLabel={stateLabel}
			initialUpdatedAt={updatedAt}
			key={updatedAt}
		/>
	);
}
