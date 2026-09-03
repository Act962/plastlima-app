import { Lead, type LeadKind } from "../../domain/lead/entities/lead";
import type { InvalidLeadError } from "../../domain/lead/errors";
import type { LeadRepository } from "../../domain/lead/repositories/lead-repository";
import { ok, type Result } from "../../domain/shared/result";
import type { Clock } from "../ports/clock";

export type SubmitLeadInput = {
	kind: LeadKind;
	name: string;
	email: string;
	phone?: string | null;
	state?: string | null;
	city?: string | null;
	message?: string | null;
};

export type SubmitLeadOutput = {
	id: string;
};

/**
 * Registra um lead vindo de um formulário do site.
 *
 * É deliberadamente o caso de uso mais simples do sistema: um formulário público
 * que falha é um cliente perdido, então não há nada aqui além de validar e
 * gravar — nem dedup, nem envio de e-mail, nem integração. O que vier depois
 * (notificação, CRM) entra como porta, sem mudar este fluxo.
 */
export class SubmitLead {
	constructor(
		private readonly leads: LeadRepository,
		private readonly clock: Clock,
	) {}

	async execute(
		input: SubmitLeadInput,
	): Promise<Result<SubmitLeadOutput, InvalidLeadError>> {
		const lead = Lead.create({ ...input, now: this.clock.now() });

		if (!lead.ok) {
			return lead;
		}

		const created = await this.leads.create(lead.value);
		const id = created.toSnapshot().id;

		if (id === null) {
			throw new Error("Repositório devolveu um lead sem id.");
		}

		return ok({ id });
	}
}
