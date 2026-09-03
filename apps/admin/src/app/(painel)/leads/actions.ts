"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/auth-actor";
import { createSetLeadStatus } from "@/lib/leads";

export type SetLeadStatusResult = { ok: true } | { ok: false; message: string };

const ERROR_MESSAGES: Record<string, string> = {
	LEAD_NOT_FOUND: "Este lead não existe mais.",
};

const FALLBACK_MESSAGE = "Não foi possível atualizar o lead. Tente de novo.";

/**
 * Marca (ou desmarca) um lead como atendido.
 *
 * Recebe `FormData` para o botão funcionar como um `<form>` normal: a tabela é
 * um Server Component e alternar o status não precisa levar JavaScript junto.
 */
export async function setLeadStatusAction(formData: FormData): Promise<void> {
	const actor = await requireActor();
	const id = String(formData.get("id") ?? "");
	const handled = formData.get("handled") === "true";

	const result = await createSetLeadStatus().execute({ id, handled, actor });

	if (!result.ok) {
		// Sem toast: a tela é server-rendered e o próximo carregamento já mostra o
		// estado real. O log preserva o caso raro (lead removido entre a página e o
		// clique) para quem for investigar.
		console.error(
			`[leads] ${ERROR_MESSAGES[result.error.code] ?? FALLBACK_MESSAGE}`,
			result.error,
		);
	}

	revalidatePath("/leads");
}
