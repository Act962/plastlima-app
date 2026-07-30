import type { ContactMessage, FranchiseLead } from "@/lib/schemas/lead";

/**
 * Boundary between the forms and whatever delivers the lead (CRM, e-mail, API route).
 * Forms depend on this contract only, so swapping the transport never touches the UI.
 */
export type LeadService = {
	submitFranchiseLead(lead: FranchiseLead): Promise<void>;
	submitContactMessage(message: ContactMessage): Promise<void>;
};

/**
 * Placeholder transport — mirrors the behaviour of the design prototype.
 * Replace with a real implementation (e.g. a `POST /api/leads` route) when the
 * backend endpoint is available; no component needs to change.
 */
export const leadService: LeadService = {
	async submitFranchiseLead(lead) {
		console.info("[lead] franchise", lead);
	},
	async submitContactMessage(message) {
		console.info("[lead] contact", message);
	},
};
