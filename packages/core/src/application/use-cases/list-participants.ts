import type { RaffleCampaign } from "../../domain/raffle/campaign";
import type {
	ParticipantListResult,
	ParticipantRepository,
} from "../../domain/raffle/repositories/participant-repository";

export type ListParticipantsInput = {
	search?: string;
	page?: number;
	pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 5000;

/**
 * Lista os participantes da campanha para o painel.
 *
 * O teto de `pageSize` existe por causa da exportação CSV, que pede a lista
 * inteira: sem limite, um parâmetro na URL derrubaria o servidor.
 */
export class ListParticipants {
	constructor(
		private readonly participants: ParticipantRepository,
		private readonly campaign: RaffleCampaign,
	) {}

	execute(input: ListParticipantsInput = {}): Promise<ParticipantListResult> {
		const pageSize = Math.min(
			Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE),
			MAX_PAGE_SIZE,
		);

		return this.participants.list({
			campaignId: this.campaign.id,
			search: input.search?.trim() || undefined,
			page: Math.max(1, input.page ?? 1),
			pageSize,
		});
	}
}
