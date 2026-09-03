import { Lead } from "../domain/lead/entities/lead";
import type {
	LeadListQuery,
	LeadListResult,
	LeadRepository,
} from "../domain/lead/repositories/lead-repository";

/** Dublê de teste do repositório de leads, com a mesma ordenação da produção. */
export class InMemoryLeadRepository implements LeadRepository {
	private readonly items = new Map<string, Lead>();
	private sequence = 0;

	async create(lead: Lead): Promise<Lead> {
		this.sequence += 1;

		const stored = Lead.restore({
			...lead.toSnapshot(),
			id: `lead-${this.sequence}`,
		});

		this.items.set(`lead-${this.sequence}`, stored);

		return stored;
	}

	async findById(id: string): Promise<Lead | null> {
		return this.items.get(id) ?? null;
	}

	async update(lead: Lead): Promise<Lead> {
		const snapshot = lead.toSnapshot();

		if (snapshot.id === null || !this.items.has(snapshot.id)) {
			throw new Error(`Lead inexistente: ${snapshot.id}`);
		}

		const stored = Lead.restore(snapshot);

		this.items.set(snapshot.id, stored);

		return stored;
	}

	async list(query: LeadListQuery): Promise<LeadListResult> {
		const page = query.page ?? 1;
		const pageSize = query.pageSize ?? 25;
		const search = query.search?.toLowerCase();

		const matching = [...this.items.values()]
			.filter((lead) => query.kind === undefined || lead.kind === query.kind)
			.filter(
				(lead) => query.status === undefined || lead.status === query.status,
			)
			.filter((lead) => {
				if (search === undefined) {
					return true;
				}

				const data = lead.toSnapshot();
				const digits = search.replace(/\D/g, "");

				return (
					data.name.toLowerCase().includes(search) ||
					data.email.includes(search) ||
					(digits.length > 0 && (data.phoneDigits ?? "").includes(digits))
				);
			})
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

		const start = (page - 1) * pageSize;

		return {
			items: matching.slice(start, start + pageSize),
			total: matching.length,
			page,
			pageSize,
		};
	}

	async countNew(): Promise<number> {
		return [...this.items.values()].filter((lead) => lead.status === "new")
			.length;
	}

	/** Quantidade total de registros — atalho de asserção para os testes. */
	get size(): number {
		return this.items.size;
	}
}
