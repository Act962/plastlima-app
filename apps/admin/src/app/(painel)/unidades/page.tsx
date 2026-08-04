import type { LocationsContent } from "@plastlima-app/core/schemas";
import type { Metadata } from "next";
import { LocationsEditor } from "@/components/unidades/locations-editor";
import { requireActor } from "@/lib/auth-actor";
import { createGetDraft, createSaveDraft } from "@/lib/content";
import { LOCATIONS_SEED } from "@/lib/locations-content";

export const metadata: Metadata = { title: "Unidades" };

const LOCATIONS_KEY = "locations";

async function loadLocations() {
	const actor = await requireActor();
	const getDraft = createGetDraft();

	let result = await getDraft.execute(LOCATIONS_KEY);

	if (!result.ok) {
		await createSaveDraft().execute({
			key: LOCATIONS_KEY,
			draft: LOCATIONS_SEED,
			actor,
		});
		result = await getDraft.execute(LOCATIONS_KEY);
	}

	if (!result.ok) {
		throw new Error("Não foi possível carregar as unidades.");
	}

	const document = result.value;
	const snapshot = document.toSnapshot();
	const state = document.publishState();

	return {
		draft: snapshot.draft as LocationsContent,
		updatedAt: snapshot.updatedAt.toISOString(),
		stateLabel: state.label,
		canPublish: state.canPublish,
	};
}

export default async function UnidadesPage() {
	const { draft, updatedAt, stateLabel, canPublish } = await loadLocations();

	return (
		<LocationsEditor
			initialCanPublish={canPublish}
			initialLocations={draft}
			initialStateLabel={stateLabel}
			initialUpdatedAt={updatedAt}
			key={updatedAt}
		/>
	);
}
