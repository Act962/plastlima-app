import {
	type RaffleCampaign,
	RegisterParticipation,
} from "@plastlima-app/core";
import {
	getPrisma,
	PrismaParticipantRepository,
	SystemClock,
} from "@plastlima-app/infra";
import { RAFFLE_CAMPAIGN } from "@/data/raffle";
import { storeDirectory } from "./store-directory";

/**
 * Raiz de composição da campanha — o único lugar do app web que conhece,
 * ao mesmo tempo, o caso de uso e as implementações concretas.
 *
 * Só pode ser importado por código de servidor: puxa o Prisma junto.
 */
const campaign: RaffleCampaign = {
	id: RAFFLE_CAMPAIGN.id,
	entriesCloseAt: RAFFLE_CAMPAIGN.entriesCloseAt,
};

export function createRegisterParticipation(): RegisterParticipation {
	return new RegisterParticipation(
		new PrismaParticipantRepository(getPrisma()),
		storeDirectory,
		new SystemClock(),
		campaign,
	);
}
