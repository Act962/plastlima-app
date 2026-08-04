import type { Metadata } from "next";
import { MediaLibrary } from "@/components/midia/media-library";
import { requireActor } from "@/lib/auth-actor";
import { isMediaConfigured } from "@/lib/media";
import type { AssetSummary } from "./actions";
import { listAssetsAction } from "./actions";

export const metadata: Metadata = { title: "Mídia" };

export default async function MidiaPage() {
	await requireActor();

	const configured = isMediaConfigured();
	const assets: AssetSummary[] = configured ? await listAssetsAction() : [];

	return <MediaLibrary configured={configured} initialAssets={assets} />;
}
