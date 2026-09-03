"use server";

import { franchiseLeadSchema } from "@plastlima-app/core/schemas";
import {
	LEAD_ERROR_MESSAGES,
	LEAD_FALLBACK_MESSAGE,
	type LeadActionResult,
} from "@/lib/leads/action-result";
import { createSubmitLead } from "@/lib/leads/submission";

/** Grava um interessado em franquia. Mesmo contrato do formulário de contato. */
export async function submitFranchiseLeadAction(
	input: unknown,
): Promise<LeadActionResult> {
	const parsed = franchiseLeadSchema.safeParse(input);

	if (!parsed.success) {
		return {
			status: "error",
			message: parsed.error.issues[0]?.message ?? LEAD_FALLBACK_MESSAGE,
		};
	}

	try {
		const result = await createSubmitLead().execute({
			kind: "franchise",
			name: parsed.data.name,
			email: parsed.data.email,
			phone: parsed.data.phone,
			state: parsed.data.state,
			city: parsed.data.city,
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
		console.error("[franquias] falha ao registrar lead", error);

		return { status: "error", message: LEAD_FALLBACK_MESSAGE };
	}

	return { status: "success" };
}
