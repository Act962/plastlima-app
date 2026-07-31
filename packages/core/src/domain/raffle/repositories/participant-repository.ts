import type { Participant } from "../entities/participant";

export type ParticipantListQuery = {
	campaignId: string;
	/** Busca por nome ou telefone. Ignorada quando vazia. */
	search?: string;
	page?: number;
	pageSize?: number;
};

export type ParticipantListResult = {
	items: Participant[];
	total: number;
	page: number;
	pageSize: number;
};

export interface ParticipantRepository {
	findByPhone(campaignId: string, phone: string): Promise<Participant | null>;

	/**
	 * Insere um novo participante.
	 *
	 * Lança `DuplicateParticipantError` quando o índice único
	 * `(campaignId, phone)` é violado — é assim que a corrida entre duas
	 * submissões simultâneas do mesmo número chega ao caso de uso.
	 */
	create(participant: Participant): Promise<Participant>;

	/** Persiste alterações de um participante já existente. */
	update(participant: Participant): Promise<Participant>;

	list(query: ParticipantListQuery): Promise<ParticipantListResult>;
}
