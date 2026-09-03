import {
	DrawWinner,
	ListParticipants,
	type RaffleCampaign,
} from "@plastlima-app/core";
import {
	getPrisma,
	PrismaParticipantRepository,
	SystemClock,
} from "@plastlima-app/infra";

/**
 * Campanha exibida no painel.
 *
 * Duplica o `id` de `apps/web/src/data/raffle.ts` de propósito: o admin não
 * depende do app público. Quando existir mais de uma campanha, isto vira um
 * seletor alimentado pelo banco.
 *
 * A campanha é uma só para os dois prêmios: o que separa os sorteios é o grupo
 * (`pool`) de cada participante, não a campanha.
 */
export const ADMIN_CAMPAIGN: RaffleCampaign = {
	id: "tv-42-2026",
	entriesCloseAt: new Date("2026-10-15T23:59:59-03:00"),
};

export function createListParticipants(): ListParticipants {
	return new ListParticipants(
		new PrismaParticipantRepository(getPrisma()),
		ADMIN_CAMPAIGN,
	);
}

export function createParticipantRepository(): PrismaParticipantRepository {
	return new PrismaParticipantRepository(getPrisma());
}

export function createDrawWinner(): DrawWinner {
	return new DrawWinner(
		createParticipantRepository(),
		ADMIN_CAMPAIGN,
		new SystemClock(),
	);
}
