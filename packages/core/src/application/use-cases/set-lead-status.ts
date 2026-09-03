import type { Lead } from "../../domain/lead/entities/lead";
import { type LeadError, LeadNotFoundError } from "../../domain/lead/errors";
import type { LeadRepository } from "../../domain/lead/repositories/lead-repository";
import type { Actor } from "../../domain/shared/actor";
import { fail, ok, type Result } from "../../domain/shared/result";
import type { Clock } from "../ports/clock";

export type SetLeadStatusInput = {
	id: string;
	handled: boolean;
	actor: Actor;
};

/**
 * Marca um lead como atendido, ou o devolve para a caixa de novos.
 *
 * Quem atendeu fica no próprio lead (`handledBy`), e não só num log: a pergunta
 * que a equipe faz é "quem falou com essa pessoa?", olhando a linha da tabela.
 */
export class SetLeadStatus {
	constructor(
		private readonly leads: LeadRepository,
		private readonly clock: Clock,
	) {}

	async execute(input: SetLeadStatusInput): Promise<Result<Lead, LeadError>> {
		const lead = await this.leads.findById(input.id);

		if (lead === null) {
			return fail(new LeadNotFoundError(input.id));
		}

		lead.setHandled(input.handled, input.actor.email, this.clock.now());

		return ok(await this.leads.update(lead));
	}
}
