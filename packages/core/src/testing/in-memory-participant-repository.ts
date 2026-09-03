import type { DrawCandidate } from "../domain/raffle/draw";
import { Participant } from "../domain/raffle/entities/participant";
import { DuplicateParticipantError } from "../domain/raffle/errors";
import type { RafflePool } from "../domain/raffle/pool";
import type {
	ParticipantListQuery,
	ParticipantListResult,
	ParticipantRepository,
} from "../domain/raffle/repositories/participant-repository";

/**
 * Dublê de teste do repositório.
 *
 * Implementa a mesma interface da produção — inclusive o comportamento do índice
 * único, que lança `DuplicateParticipantError`. Sem isso, o teste da corrida
 * entre duas submissões simultâneas não teria como existir.
 */
export class InMemoryParticipantRepository implements ParticipantRepository {
	private readonly items = new Map<string, Participant>();
	private sequence = 0;

	/**
	 * Gancho para simular concorrência: roda logo antes da checagem de duplicata
	 * em `create`, permitindo ao teste inserir o mesmo telefone no meio do fluxo.
	 */
	onBeforeCreate: (() => Promise<void> | void) | null = null;

	async findByPhone(
		campaignId: string,
		phone: string,
	): Promise<Participant | null> {
		return this.items.get(key(campaignId, phone)) ?? null;
	}

	async create(participant: Participant): Promise<Participant> {
		if (this.onBeforeCreate !== null) {
			await this.onBeforeCreate();
		}

		const snapshot = participant.toSnapshot();
		const itemKey = key(snapshot.campaignId, snapshot.phone);

		if (this.items.has(itemKey)) {
			throw new DuplicateParticipantError(snapshot.phone);
		}

		this.sequence += 1;

		const stored = Participant.restore({
			...snapshot,
			id: `participant-${this.sequence}`,
		});

		this.items.set(itemKey, stored);

		return stored;
	}

	async update(participant: Participant): Promise<Participant> {
		const snapshot = participant.toSnapshot();
		const itemKey = key(snapshot.campaignId, snapshot.phone);

		if (!this.items.has(itemKey)) {
			throw new Error(`Participante inexistente: ${snapshot.phone}`);
		}

		const stored = Participant.restore(snapshot);

		this.items.set(itemKey, stored);

		return stored;
	}

	async list(query: ParticipantListQuery): Promise<ParticipantListResult> {
		const page = query.page ?? 1;
		const pageSize = query.pageSize ?? 25;
		const search = query.search?.toLowerCase();

		const matching = [...this.items.values()]
			.filter((participant) => participant.campaignId === query.campaignId)
			.filter(
				(participant) =>
					query.pool === undefined || participant.pool === query.pool,
			)
			.filter((participant) => {
				if (search === undefined) {
					return true;
				}

				const digits = search.replace(/\D/g, "");

				return (
					participant.name.toLowerCase().includes(search) ||
					participant.phone.value.includes(digits) ||
					(digits.length > 0 &&
						(participant.document?.value.includes(digits) ?? false))
				);
			})
			.sort(
				(a, b) =>
					b.toSnapshot().createdAt.getTime() -
					a.toSnapshot().createdAt.getTime(),
			);

		const start = (page - 1) * pageSize;

		return {
			items: matching.slice(start, start + pageSize),
			total: matching.length,
			page,
			pageSize,
		};
	}

	async listForDraw(
		campaignId: string,
		pool?: RafflePool,
	): Promise<DrawCandidate[]> {
		return [...this.items.values()]
			.filter((participant) => participant.campaignId === campaignId)
			.filter((participant) => pool === undefined || participant.pool === pool)
			.map((participant) => {
				const snapshot = participant.toSnapshot();

				return {
					name: snapshot.name,
					phone: snapshot.phone,
					phoneDisplay: snapshot.phoneDisplay,
					storeName: snapshot.storeName,
					city: snapshot.city,
					state: snapshot.state,
					participationCount: snapshot.participationCount,
					createdAt: snapshot.createdAt,
				};
			});
	}

	/** Quantidade total de registros — atalho de asserção para os testes. */
	get size(): number {
		return this.items.size;
	}
}

function key(campaignId: string, phone: string): string {
	return `${campaignId}:${phone}`;
}
