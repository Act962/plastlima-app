"use server";

import {
	InvalidContentError,
	NoChangesToPublishError,
} from "@plastlima-app/core";
import type { HomeContent } from "@plastlima-app/core/schemas";
import { requireActor } from "@/lib/auth-actor";
import { createPublishDocument, createSaveDraft } from "@/lib/content";

const HOME_KEY = "home";

export type SaveDraftResult = { ok: true; savedAt: string };

/**
 * Salva o rascunho da home (autosave da tela). Não valida o shape de propósito:
 * o rascunho pode estar no meio da edição (spec §6.3). A validação estrita é da
 * publicação.
 */
export async function saveHomeDraftAction(
	draft: HomeContent,
): Promise<SaveDraftResult> {
	const actor = await requireActor();

	await createSaveDraft().execute({ key: HOME_KEY, draft, actor });

	return { ok: true, savedAt: new Date().toISOString() };
}

/** Um problema de validação por campo, para a UI apontar onde corrigir. */
export type PublishIssue = { path: string; message: string };

export type PublishResult =
	| { ok: true; version: number }
	| { ok: false; message: string; issues?: PublishIssue[] };

/**
 * Publica a home. Traduz os erros de domínio em mensagens pt-BR para a interface
 * — nada de código de erro cru chegando ao editor.
 */
export async function publishHomeAction(): Promise<PublishResult> {
	const actor = await requireActor();

	const result = await createPublishDocument().execute({
		key: HOME_KEY,
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
			issues: error.issues.map((issue) => ({
				path: issue.path,
				message: issue.message,
			})),
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
