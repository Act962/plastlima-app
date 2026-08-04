"use server";

import {
	InvalidContentError,
	NoChangesToPublishError,
	RevisionNotFoundError,
} from "@plastlima-app/core";
import type { HomeContent } from "@plastlima-app/core/schemas";
import { createPreviewToken } from "@plastlima-app/infra";
import { requireActor } from "@/lib/auth-actor";
import {
	createListRevisions,
	createPublishDocument,
	createRollbackToRevision,
	createSaveDraft,
} from "@/lib/content";

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

/** Uma revisão no histórico, já serializada para a interface. */
export type RevisionSummary = {
	version: number;
	createdBy: string;
	createdAt: string;
	note: string | null;
};

/**
 * Lista as revisões da home, da mais recente para a mais antiga — alimenta o
 * drawer de histórico (spec §6.5). Devolve só o que a UI mostra, não o JSON
 * inteiro de cada revisão.
 */
export async function listHomeRevisionsAction(): Promise<RevisionSummary[]> {
	await requireActor();

	const result = await createListRevisions().execute(HOME_KEY);

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

export type RollbackResult =
	| { ok: true; version: number; restoredFrom: number }
	| { ok: false; message: string };

/**
 * Restaura a home para o conteúdo de uma revisão anterior. Cria uma revisão
 * nova (o histórico nunca encolhe — invariante 3) e revalida o site.
 */
export async function rollbackHomeAction(
	version: number,
): Promise<RollbackResult> {
	const actor = await requireActor();

	const result = await createRollbackToRevision().execute({
		key: HOME_KEY,
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

/**
 * Monta a URL de pré-visualização do site em modo rascunho (spec §7.4).
 *
 * Devolve `null` quando o preview não está configurado (`PREVIEW_SECRET` ou
 * `PUBLIC_SITE_URL` ausentes) — a interface trata isso como indisponível em vez
 * de gerar um link quebrado. O token é assinado no servidor; o segredo nunca vai
 * para o cliente nem para a URL.
 */
export async function createHomePreviewUrlAction(): Promise<string | null> {
	await requireActor();

	const secret = process.env.PREVIEW_SECRET;
	const baseUrl = process.env.PUBLIC_SITE_URL;

	if (!secret || !baseUrl) {
		return null;
	}

	const url = new URL("/api/preview", baseUrl);
	url.searchParams.set("token", createPreviewToken(secret, Date.now()));
	url.searchParams.set("path", "/");

	return url.toString();
}
