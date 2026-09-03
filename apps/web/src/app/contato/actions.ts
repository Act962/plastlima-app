"use server";

import { contactMessageSchema } from "@plastlima-app/core/schemas";
import {
	LEAD_ERROR_MESSAGES,
	LEAD_FALLBACK_MESSAGE,
	type LeadActionResult,
} from "@/lib/leads/action-result";
import { createSubmitLead } from "@/lib/leads/submission";

/**
 * Grava uma mensagem do formulário de contato.
 *
 * Revalida com o mesmo schema do cliente — validação no navegador é
 * conveniência, esta é a que não dá para burlar. Diferente do sorteio, não há
 * redirect: a página troca o formulário por uma confirmação no lugar.
 */
export async function submitContactMessageAction(
	input: unknown,
): Promise<LeadActionResult> {
	const parsed = contactMessageSchema.safeParse(input);

	if (!parsed.success) {
		return {
			status: "error",
			message: parsed.error.issues[0]?.message ?? LEAD_FALLBACK_MESSAGE,
		};
	}

	try {
		const result = await createSubmitLead().execute({
			kind: "contact",
			name: parsed.data.name,
			email: parsed.data.email,
			message: parsed.data.message,
		});

		if (!result.ok) {
			return {
				status: "error",
				message:
					LEAD_ERROR_MESSAGES[result.error.code] ?? LEAD_FALLBACK_MESSAGE,
			};
		}
	} catch (error) {
		// O banco fora do ar não pode virar uma tela branca: o log preserva o que
		// aconteceu e a pessoa recebe um pedido de nova tentativa.
		console.error("[contato] falha ao registrar mensagem", error);

		return { status: "error", message: LEAD_FALLBACK_MESSAGE };
	}

	return { status: "success" };
}
