import { describe, expect, it } from "vitest";
import type { Actor } from "../../domain/shared/actor";
import { FixedClock, InMemoryLeadRepository } from "../../testing";
import { ListLeads } from "./list-leads";
import { SetLeadStatus } from "./set-lead-status";
import { SubmitLead } from "./submit-lead";

const NOW = new Date("2026-03-10T12:00:00Z");
const LATER = new Date("2026-03-11T09:30:00Z");

const ACTOR: Actor = { id: "user-1", email: "atendimento@plastlima.com.br" };

async function setup() {
	const leads = new InMemoryLeadRepository();
	const clock = new FixedClock(NOW);

	const submitted = await new SubmitLead(leads, clock).execute({
		kind: "contact",
		name: "Maria Souza",
		email: "maria@exemplo.com",
		message: "Gostaria de saber os horários de entrega.",
	});

	clock.travelTo(LATER);

	return {
		leads,
		list: new ListLeads(leads),
		useCase: new SetLeadStatus(leads, clock),
		id: submitted.ok ? submitted.value.id : "",
	};
}

describe("SetLeadStatus", () => {
	it("marca como atendido registrando quem atendeu e quando", async () => {
		const { useCase, id } = await setup();

		const result = await useCase.execute({ id, handled: true, actor: ACTOR });

		expect(result.ok).toBe(true);
		expect(result.ok && result.value.toSnapshot()).toMatchObject({
			status: "handled",
			handledAt: LATER,
			handledBy: ACTOR.email,
		});
	});

	it("limpa quem atendeu ao devolver o lead para a caixa de novos", async () => {
		const { useCase, id } = await setup();

		await useCase.execute({ id, handled: true, actor: ACTOR });

		const result = await useCase.execute({ id, handled: false, actor: ACTOR });

		expect(result.ok && result.value.toSnapshot()).toMatchObject({
			status: "new",
			handledAt: null,
			handledBy: null,
		});
	});

	it("falha com LEAD_NOT_FOUND quando o id não existe", async () => {
		const { useCase } = await setup();

		const result = await useCase.execute({
			id: "lead-inexistente",
			handled: true,
			actor: ACTOR,
		});

		expect(result.ok).toBe(false);
		expect(result.ok === false && result.error.code).toBe("LEAD_NOT_FOUND");
	});

	it("some da contagem de novos depois de atendido", async () => {
		const { useCase, list, id } = await setup();

		expect(await list.countNew()).toBe(1);

		await useCase.execute({ id, handled: true, actor: ACTOR });

		expect(await list.countNew()).toBe(0);
	});
});
