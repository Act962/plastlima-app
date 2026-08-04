import type { SiteContent } from "@plastlima-app/core/schemas";
import type { Metadata } from "next";
import { SiteEditor } from "@/components/config/site-editor";
import { requireActor } from "@/lib/auth-actor";
import { createGetDraft, createSaveDraft } from "@/lib/content";
import { SITE_SEED } from "@/lib/site-content";

export const metadata: Metadata = { title: "Configurações do site" };

const SITE_KEY = "site";

async function loadSite() {
	const actor = await requireActor();
	const getDraft = createGetDraft();

	let result = await getDraft.execute(SITE_KEY);

	if (!result.ok) {
		await createSaveDraft().execute({ key: SITE_KEY, draft: SITE_SEED, actor });
		result = await getDraft.execute(SITE_KEY);
	}

	if (!result.ok) {
		throw new Error("Não foi possível carregar as configurações do site.");
	}

	const document = result.value;
	const snapshot = document.toSnapshot();
	const state = document.publishState();

	return {
		draft: snapshot.draft as SiteContent,
		updatedAt: snapshot.updatedAt.toISOString(),
		stateLabel: state.label,
		canPublish: state.canPublish,
	};
}

export default async function ConfigPage() {
	const { draft, updatedAt, stateLabel, canPublish } = await loadSite();

	return (
		<SiteEditor
			initialCanPublish={canPublish}
			initialSite={draft}
			initialStateLabel={stateLabel}
			initialUpdatedAt={updatedAt}
			key={updatedAt}
		/>
	);
}
