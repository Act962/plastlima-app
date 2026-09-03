import type { Lead, LeadKind, LeadStatus } from "../entities/lead";

export type LeadListQuery = {
	/** Filtra pela origem do formulário. Ausente = contato e franquia juntos. */
	kind?: LeadKind;
	status?: LeadStatus;
	/** Busca por nome, e-mail ou telefone. Ignorada quando vazia. */
	search?: string;
	page?: number;
	pageSize?: number;
};

export type LeadListResult = {
	items: Lead[];
	total: number;
	page: number;
	pageSize: number;
};

export interface LeadRepository {
	create(lead: Lead): Promise<Lead>;

	findById(id: string): Promise<Lead | null>;

	/** Persiste alterações de um lead já existente (hoje, só a mudança de status). */
	update(lead: Lead): Promise<Lead>;

	list(query: LeadListQuery): Promise<LeadListResult>;

	/**
	 * Quantos leads ainda não foram atendidos.
	 *
	 * Separado de `list` porque o número é sobre a caixa inteira, não sobre a
	 * página nem sobre o filtro em uso — quem está lendo "franquias atendidas"
	 * ainda precisa ver que há contato novo esperando.
	 */
	countNew(): Promise<number>;
}
