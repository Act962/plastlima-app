import type { DrawCandidate } from "../draw";
import type { Participant } from "../entities/participant";
import type { RafflePool } from "../pool";

export type ParticipantListQuery = {
	campaignId: string;
	/** Restringe a um grupo sorteado. Sem valor, traz os dois. */
	pool?: RafflePool;
	/** Busca por nome, telefone ou documento. Ignorada quando vazia. */
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

	/**
	 * Os participantes da campanha (opcionalmente de um grupo só), na forma
	 * mínima que a apuração precisa.
	 *
	 * Existe separado de `list` porque o sorteio percorre a campanha inteira e
	 * não pode arrastar o `receiptImage` junto: são data URLs de até 800 mil
	 * caracteres, e uma base de alguns milhares viraria centenas de MB para
	 * responder uma pergunta que só depende do telefone.
	 */
	listForDraw(campaignId: string, pool?: RafflePool): Promise<DrawCandidate[]>;
}
