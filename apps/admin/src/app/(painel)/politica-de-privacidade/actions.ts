"use server";

import {
	InvalidContentError,
	NoChangesToPublishError,
	RevisionNotFoundError,
} from "@plastlima-app/core";
import type { PrivacyPolicyContent } from "@plastlima-app/core/schemas";
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

const PRIVACY_POLICY_KEY = "privacy-policy";

/** Salva o rascunho da política (autosave). Não valida shape. */
export async function savePrivacyPolicyDraftAction(
	draft: PrivacyPolicyContent,
): Promise<SaveDraftResult> {
	const actor = await requireActor();

	await createSaveDraft().execute({ key: PRIVACY_POLICY_KEY, draft, actor });

	return { ok: true, savedAt: new Date().toISOString() };
}

/** Publica a política, traduzindo erros de domínio para pt-BR. */
export async function publishPrivacyPolicyAction(): Promise<PublishResult> {
	const actor = await requireActor();

	const result = await createPublishDocument().execute({
		key: PRIVACY_POLICY_KEY,
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

/** Revisões da política, da mais recente para a mais antiga. */
export async function listPrivacyPolicyRevisionsAction(): Promise<
	RevisionSummary[]
> {
	await requireActor();

	const result = await createListRevisions().execute(PRIVACY_POLICY_KEY);

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

/** Restaura a política para uma revisão anterior (cria revisão nova). */
export async function rollbackPrivacyPolicyAction(
	version: number,
): Promise<RollbackResult> {
	const actor = await requireActor();

	const result = await createRollbackToRevision().execute({
		key: PRIVACY_POLICY_KEY,
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

/** URL de pré-visualização da política em modo rascunho. */
export async function createPrivacyPolicyPreviewUrlAction(): Promise<
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
	url.searchParams.set("path", "/politica-de-privacidade");

	return url.toString();
}
