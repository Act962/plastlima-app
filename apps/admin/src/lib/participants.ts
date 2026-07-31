import { ListParticipants, type RaffleCampaign } from "@plastlima-app/core";
import { getPrisma, PrismaParticipantRepository } from "@plastlima-app/infra";

/**
 * Campanha exibida no painel.
 *
 * Duplica o `id` de `apps/web/src/data/raffle.ts` de propósito: o admin não
 * depende do app público. Quando existir mais de uma campanha, isto vira um
 * seletor alimentado pelo banco.
 */
export const ADMIN_CAMPAIGN: RaffleCampaign = {
	id: "kit-churrasco-2026",
	entriesCloseAt: new Date("2026-08-30T23:59:59-03:00"),
};

export function createListParticipants(): ListParticipants {
	return new ListParticipants(
		new PrismaParticipantRepository(getPrisma()),
		ADMIN_CAMPAIGN,
	);
}
