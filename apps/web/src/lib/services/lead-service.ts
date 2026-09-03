import type {
	ContactMessage,
	FranchiseLead,
} from "@plastlima-app/core/schemas";
import { submitContactMessageAction } from "@/app/contato/actions";
import { submitFranchiseLeadAction } from "@/app/franquias/actions";
import type { LeadActionResult } from "@/lib/leads/action-result";

/**
 * Fronteira entre os formulários e o que entrega o lead.
 *
 * Os formulários dependem só deste contrato, então trocar o transporte — hoje
 * Server Action + banco, amanhã também um e-mail ou um CRM — não toca a UI.
 */
export type LeadService = {
	submitFranchiseLead(lead: FranchiseLead): Promise<void>;
	submitContactMessage(message: ContactMessage): Promise<void>;
};

export const leadService: LeadService = {
	async submitFranchiseLead(lead) {
		await deliver(submitFranchiseLeadAction(lead));
	},
	async submitContactMessage(message) {
		await deliver(submitContactMessageAction(message));
	},
};

/**
 * Converte o resultado da action na convenção do `useFormSubmission`, que
 * espera uma promessa rejeitada para exibir o erro. A mensagem vem de lá: o
 * hook mostra o texto do `Error`, não um genérico.
 */
async function deliver(pending: Promise<LeadActionResult>): Promise<void> {
	const result = await pending;

	if (result.status === "error") {
		throw new Error(result.message);
	}
}
