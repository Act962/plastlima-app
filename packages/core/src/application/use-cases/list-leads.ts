import type { LeadKind, LeadStatus } from "../../domain/lead/entities/lead";
import type {
	LeadListResult,
	LeadRepository,
} from "../../domain/lead/repositories/lead-repository";

export type ListLeadsInput = {
	kind?: LeadKind;
	status?: LeadStatus;
	search?: string;
	page?: number;
	pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 5000;

/**
 * Lista os leads para o painel.
 *
 * O teto de `pageSize` é o mesmo de `ListParticipants` e pela mesma razão: a
 * exportação CSV pede a lista inteira, e sem limite um parâmetro na URL
 * derrubaria o servidor.
 */
export class ListLeads {
	constructor(private readonly leads: LeadRepository) {}

	execute(input: ListLeadsInput = {}): Promise<LeadListResult> {
		const pageSize = Math.min(
			Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE),
			MAX_PAGE_SIZE,
		);

		return this.leads.list({
			kind: input.kind,
			status: input.status,
			search: input.search?.trim() || undefined,
			page: Math.max(1, input.page ?? 1),
			pageSize,
		});
	}

	/** Quantos leads seguem sem atendimento, independente do filtro em uso. */
	countNew(): Promise<number> {
		return this.leads.countNew();
	}
}
