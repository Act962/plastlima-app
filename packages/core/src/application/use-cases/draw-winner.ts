import type { RaffleCampaign } from "../../domain/raffle/campaign";
import {
	buildDrawRecord,
	type DrawCriterion,
	type DrawnCandidate,
	type DrawRecord,
	drawOrder,
	parsePhoneList,
	splitByEligibility,
} from "../../domain/raffle/draw";
import {
	type DrawError,
	EmptyDrawError,
	MissingSeedError,
} from "../../domain/raffle/errors";
import type { RafflePool } from "../../domain/raffle/pool";
import type { ParticipantRepository } from "../../domain/raffle/repositories/participant-repository";
import { fail, ok, type Result } from "../../domain/shared/result";
import type { Clock } from "../ports/clock";

/** Apuração de verdade ou ensaio. A conta é a mesma; o que muda é o que vale. */
export type DrawMode = "official" | "simulation";

const DEFAULT_SUBSTITUTES = 3;
const MAX_SUBSTITUTES = 10;

export type DrawWinnerInput = {
	/**
	 * Grupo a apurar. Obrigatório porque a campanha entrega um prêmio por grupo:
	 * apurar "a campanha inteira" misturaria dois sorteios diferentes.
	 */
	pool: RafflePool;
	/** Valor público que origina o sorteio (ex.: Loteria Federal do dia). */
	seed: string;
	criterion?: DrawCriterion;
	/** Telefones desclassificados, como digitados (vírgula, `;` ou linha). */
	excludedPhones?: string;
	substitutes?: number;
	mode?: DrawMode;
};

export type DrawWinnerOutput = {
	record: DrawRecord;
	winner: DrawnCandidate;
	runnersUp: DrawnCandidate[];
};

/**
 * Apura o ganhador de um grupo da campanha.
 *
 * Apurar não depende de as inscrições terem encerrado — é decisão de quem
 * conduz, e a tela avisa quando o prazo ainda está correndo. O que o caso de uso
 * garante é que cadastro feito **depois** do prazo nunca concorre (o corte vive
 * em `splitByEligibility`) e que não existe ata sem ninguém elegível.
 *
 * O sorteio em si é a função pura de `domain/raffle/draw`
 * — a mesma que o script de apuração usa, para painel e terminal nunca chegarem
 * a ganhadores diferentes.
 *
 * Nada é gravado: com a mesma semente e a mesma base, repetir a apuração devolve
 * exatamente o mesmo resultado.
 */
export class DrawWinner {
	constructor(
		private readonly participants: ParticipantRepository,
		private readonly campaign: RaffleCampaign,
		private readonly clock: Clock,
	) {}

	async execute(
		input: DrawWinnerInput,
	): Promise<Result<DrawWinnerOutput, DrawError>> {
		const seed = input.seed.trim();

		if (seed.length === 0) {
			return fail(new MissingSeedError());
		}

		const now = this.clock.now();
		const candidates = await this.participants.listForDraw(
			this.campaign.id,
			input.pool,
		);

		const split = splitByEligibility(candidates, {
			cutoff: this.campaign.entriesCloseAt,
			excluded: parsePhoneList(input.excludedPhones ?? ""),
		});

		if (split.eligible.length === 0) {
			return fail(new EmptyDrawError());
		}

		const criterion = input.criterion ?? "simples";
		const order = drawOrder(seed, split.eligible, criterion);
		const substitutes = Math.min(
			Math.max(0, input.substitutes ?? DEFAULT_SUBSTITUTES),
			MAX_SUBSTITUTES,
		);

		const record = buildDrawRecord({
			campaignId: this.campaign.id,
			pool: input.pool,
			seed,
			criterion,
			cutoff: this.campaign.entriesCloseAt,
			now,
			split,
			order,
			substitutes,
		});

		// `order` nunca é vazio aqui: `split.eligible` já foi verificado acima.
		const [winner, ...rest] = order as [DrawnCandidate, ...DrawnCandidate[]];

		return ok({ record, winner, runnersUp: rest.slice(0, substitutes) });
	}
}
