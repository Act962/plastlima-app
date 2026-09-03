import type {
	Lead,
	LeadListQuery,
	LeadListResult,
	LeadRepository,
} from "@plastlima-app/core";
import type { Prisma, PrismaClient } from "@prisma/client";
import { toCreateData, toDomain } from "./lead-mapper";

export class PrismaLeadRepository implements LeadRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async create(lead: Lead): Promise<Lead> {
		const record = await this.prisma.lead.create({ data: toCreateData(lead) });

		return toDomain(record);
	}

	async findById(id: string): Promise<Lead | null> {
		// Um id fora do formato ObjectId faz o driver do Mongo lançar; para quem
		// chama, "não existe" é a resposta correta de qualquer forma.
		if (!isObjectId(id)) {
			return null;
		}

		const record = await this.prisma.lead.findUnique({ where: { id } });

		return record === null ? null : toDomain(record);
	}

	async update(lead: Lead): Promise<Lead> {
		const snapshot = lead.toSnapshot();

		if (snapshot.id === null) {
			throw new Error("Lead sem id não pode ser atualizado.");
		}

		const record = await this.prisma.lead.update({
			where: { id: snapshot.id },
			data: {
				status: snapshot.status,
				handledAt: snapshot.handledAt,
				handledBy: snapshot.handledBy,
			},
		});

		return toDomain(record);
	}

	async list(query: LeadListQuery): Promise<LeadListResult> {
		const page = query.page ?? 1;
		const pageSize = query.pageSize ?? 25;
		const where = buildWhere(query);

		// Duas consultas independentes em vez de `$transaction`: não há nada para
		// manter atômico entre a página e o total (mesmo padrão de participantes).
		const [records, total] = await Promise.all([
			this.prisma.lead.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * pageSize,
				take: pageSize,
			}),
			this.prisma.lead.count({ where }),
		]);

		return { items: records.map(toDomain), total, page, pageSize };
	}

	countNew(): Promise<number> {
		return this.prisma.lead.count({ where: { status: "new" } });
	}
}

function buildWhere(query: LeadListQuery): Prisma.LeadWhereInput {
	const where: Prisma.LeadWhereInput = {};

	if (query.kind !== undefined) {
		where.kind = query.kind;
	}

	if (query.status !== undefined) {
		where.status = query.status;
	}

	const search = query.search?.trim();

	if (search === undefined || search.length === 0) {
		return where;
	}

	const digits = search.replace(/\D/g, "");

	const or: Prisma.LeadWhereInput[] = [
		{ name: { contains: search, mode: "insensitive" } },
		{ email: { contains: search, mode: "insensitive" } },
	];

	// Só busca por telefone quando há dígitos: um `contains: ""` casaria com
	// todo mundo e transformaria a busca por texto em "listar tudo".
	if (digits.length > 0) {
		or.push({ phoneDigits: { contains: digits } });
	}

	where.OR = or;

	return where;
}

/** 24 caracteres hexadecimais — o formato do `_id` do MongoDB. */
function isObjectId(value: string): boolean {
	return /^[0-9a-f]{24}$/i.test(value);
}
