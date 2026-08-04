"use server";

import {
	InvalidContentError,
	NoChangesToPublishError,
	RevisionNotFoundError,
} from "@plastlima-app/core";
import type { FranchiseContent } from "@plastlima-app/core/schemas";
import { createPreviewToken } from "@plastlima-app/infra";
import { requireActor } from "@/lib/auth-actor";
import {
	createListRevisions,
	createPublishDocument,
	createRollbackToRevision,
	createSaveDraft,
} from "@/lib/content";
import type { RevisionSummary, RollbackResult } from "@/lib/revisions";
import type {
	PublishIssue,
	PublishResult,
	SaveDraftResult,
} from "../inicio/actions";

const FRANCHISE_KEY = "franchise";

/** Salva o rascunho da página de franquias (autosave). Não valida shape. */
export async function saveFranchiseDraftAction(
	draft: FranchiseContent,
): Promise<SaveDraftResult> {
	const actor = await requireActor();

	await createSaveDraft().execute({ key: FRANCHISE_KEY, draft, actor });

	return { ok: true, savedAt: new Date().toISOString() };
}

/** Publica a página de franquias, traduzindo erros de domínio para pt-BR. */
export async function publishFranchiseAction(): Promise<PublishResult> {
	const actor = await requireActor();

	const result = await createPublishDocument().execute({
		key: FRANCHISE_KEY,
		actor,
	});

	if (result.ok) {
		return { ok: true, version: result.value.version };
	}

	const error = result.error;

	if (error instanceof InvalidContentError) {
		return {
			ok: false,
			message: "Corrija os campos destacados antes de publicar.",
			issues: error.issues.map(
				(issue): PublishIssue => ({
					path: issue.path,
					message: issue.message,
				}),
			),
		};
	}

	if (error instanceof NoChangesToPublishError) {
		return {
			ok: false,
			message: "Nada a publicar: o rascunho é igual ao que já está no ar.",
		};
	}

	return {
		ok: false,
		message: "Não foi possível publicar agora. Tente novamente em instantes.",
	};
}

/** Revisões da página de franquias, da mais recente para a mais antiga. */
export async function listFranchiseRevisionsAction(): Promise<
	RevisionSummary[]
> {
	await requireActor();

	const result = await createListRevisions().execute(FRANCHISE_KEY);

	if (!result.ok) {
		return [];
	}

	return result.value.map((revision) => {
		const snapshot = revision.toSnapshot();
		return {
			version: snapshot.version,
			createdBy: snapshot.createdBy,
			createdAt: snapshot.createdAt.toISOString(),
			note: snapshot.note,
		};
	});
}

/** Restaura a página de franquias para uma revisão anterior (cria revisão nova). */
export async function rollbackFranchiseAction(
	version: number,
): Promise<RollbackResult> {
	const actor = await requireActor();

	const result = await createRollbackToRevision().execute({
		key: FRANCHISE_KEY,
		version,
		actor,
	});

	if (result.ok) {
		return {
			ok: true,
			version: result.value.version,
			restoredFrom: result.value.restoredFrom,
		};
	}

	if (result.error instanceof RevisionNotFoundError) {
		return { ok: false, message: "Essa revisão não existe mais." };
	}

	return {
		ok: false,
		message: "Não foi possível restaurar agora. Tente novamente em instantes.",
	};
}

/** URL de pré-visualização da página de franquias em modo rascunho. */
export async function createFranchisePreviewUrlAction(): Promise<
	string | null
> {
	await requireActor();

	const secret = process.env.PREVIEW_SECRET;
	const baseUrl = process.env.PUBLIC_SITE_URL;

	if (!secret || !baseUrl) {
		return null;
	}

	const url = new URL("/api/preview", baseUrl);
	url.searchParams.set("token", createPreviewToken(secret, Date.now()));
	url.searchParams.set("path", "/franquias");

	return url.toString();
}
