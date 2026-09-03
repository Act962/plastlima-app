import { SubmitLead } from "@plastlima-app/core";
import {
	getPrisma,
	PrismaLeadRepository,
	SystemClock,
} from "@plastlima-app/infra";

/**
 * Raiz de composição dos formulários públicos — o único lugar do app web que
 * conhece, ao mesmo tempo, o caso de uso e as implementações concretas.
 *
 * Só pode ser importado por código de servidor: puxa o Prisma junto.
 */
export function createSubmitLead(): SubmitLead {
	return new SubmitLead(
		new PrismaLeadRepository(getPrisma()),
		new SystemClock(),
	);
}
