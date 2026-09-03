import {
	type DrawCandidate,
	DuplicateParticipantError,
	type Participant,
	type ParticipantListQuery,
	type ParticipantListResult,
	type ParticipantRepository,
	type RafflePool,
} from "@plastlima-app/core";
import type { Prisma, PrismaClient } from "@prisma/client";
import { toCreateData, toDomain } from "./participant-mapper";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

export class PrismaParticipantRepository implements ParticipantRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findByPhone(
		campaignId: string,
		phone: string,
	): Promise<Participant | null> {
		const record = await this.prisma.participant.findUnique({
			where: { campaignId_phone: { campaignId, phone } },
		});

		return record === null ? null : toDomain(record);
	}

	async create(participant: Participant): Promise<Participant> {
		try {
			const record = await this.prisma.participant.create({
				data: toCreateData(participant),
			});

			return toDomain(record);
		} catch (error) {
			if (isUniqueConstraintViolation(error)) {
				// Traduz o erro do Prisma para a linguagem do domínio: o caso de uso
				// não deve conhecer códigos de erro do banco.
				throw new DuplicateParticipantError(participant.phone.value);
			}

			throw error;
		}
	}

	async update(participant: Participant): Promise<Participant> {
		const snapshot = participant.toSnapshot();

		if (snapshot.id === null) {
			throw new Error("Participante sem id não pode ser atualizado.");
		}

		const record = await this.prisma.participant.update({
			where: { id: snapshot.id },
			data: {
				participationCount: snapshot.participationCount,
				lastParticipatedAt: snapshot.lastParticipatedAt,
			},
		});

		return toDomain(record);
	}

	/**
	 * O `select` é o ponto do método: sem ele, o Prisma traz o `receiptImage` de
	 * cada participante — data URLs de até 800 mil caracteres — só para a
	 * apuração descartar. Numa campanha de alguns milhares, é a diferença entre
	 * uma consulta e centenas de MB de tráfego.
	 */
	async listForDraw(
		campaignId: string,
		pool?: RafflePool,
	): Promise<DrawCandidate[]> {
		return this.prisma.participant.findMany({
			where: { campaignId, ...poolFilter(pool) },
			orderBy: { createdAt: "asc" },
			select: {
				name: true,
				phone: true,
				phoneDisplay: true,
				storeName: true,
				city: true,
				state: true,
				participationCount: true,
				createdAt: true,
			},
		});
	}

	async list(query: ParticipantListQuery): Promise<ParticipantListResult> {
		const page = query.page ?? 1;
		const pageSize = query.pageSize ?? 25;
		const where = buildWhere(query);

		// Duas consultas independentes em vez de `$transaction`: transação no
		// MongoDB exige replica set e aqui não há nada para manter atômico.
		const [records, total] = await Promise.all([
			this.prisma.participant.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * pageSize,
				take: pageSize,
			}),
			this.prisma.participant.count({ where }),
		]);

		return {
			items: records.map(toDomain),
			total,
			page,
			pageSize,
		};
	}
}

/**
 * Filtro do grupo sorteado.
 *
 * "unidades" precisa aceitar `null` porque os participantes da campanha anterior
 * foram gravados antes de o campo existir — e todos eles eram de loja.
 */
function poolFilter(pool?: RafflePool): Prisma.ParticipantWhereInput {
	if (pool === undefined) {
		return {};
	}

	return pool === "unidades"
		? { OR: [{ pool: "unidades" }, { pool: null }] }
		: { pool };
}

function buildWhere(query: ParticipantListQuery): Prisma.ParticipantWhereInput {
	const search = query.search?.trim();
	const scope: Prisma.ParticipantWhereInput = {
		campaignId: query.campaignId,
		...poolFilter(query.pool),
	};

	if (search === undefined || search.length === 0) {
		return scope;
	}

	const digits = search.replace(/\D/g, "");

	const or: Prisma.ParticipantWhereInput[] = [
		{ name: { contains: search, mode: "insensitive" } },
	];

	if (digits.length > 0) {
		or.push({ phone: { contains: digits } });
		or.push({ document: { contains: digits } });
	}

	// `AND` em vez de espalhar o `OR` no mesmo objeto: o filtro de grupo já usa
	// um `OR` próprio, e os dois no mesmo nível se sobrescreveriam.
	return { AND: [scope, { OR: or }] };
}

/**
 * Detecta violação de índice único sem usar `instanceof`.
 *
 * O pnpm pode resolver mais de uma cópia de `@prisma/client` na árvore, e nesse
 * cenário `instanceof PrismaClientKnownRequestError` falha mesmo com o erro
 * certo. O código `P2002` é estável e é o que realmente importa.
 */
function isUniqueConstraintViolation(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code: unknown }).code === UNIQUE_CONSTRAINT_VIOLATION
	);
}
