import { ListLeads, SetLeadStatus } from "@plastlima-app/core";
import {
	getPrisma,
	PrismaLeadRepository,
	SystemClock,
} from "@plastlima-app/infra";

/**
 * Raiz de composição dos leads no painel.
 *
 * Diferente do conteúdo, não há `CacheInvalidator` nem `ContentValidator` aqui:
 * lead não aparece no site, então nada precisa ser revalidado quando muda.
 */
export function createListLeads(): ListLeads {
	return new ListLeads(new PrismaLeadRepository(getPrisma()));
}

export function createSetLeadStatus(): SetLeadStatus {
	return new SetLeadStatus(
		new PrismaLeadRepository(getPrisma()),
		new SystemClock(),
	);
}
