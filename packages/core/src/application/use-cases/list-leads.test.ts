import { describe, expect, it } from "vitest";
import { FixedClock, InMemoryLeadRepository } from "../../testing";
import { ListLeads } from "./list-leads";
import { SubmitLead } from "./submit-lead";

const NOW = new Date("2026-03-10T12:00:00Z");

async function setup() {
	const leads = new InMemoryLeadRepository();
	const clock = new FixedClock(NOW);
	const submit = new SubmitLead(leads, clock);

	await submit.execute({
		kind: "contact",
		name: "Maria Souza",
		email: "maria@exemplo.com",
		message: "Gostaria de saber os horários de entrega.",
	});

	clock.travelTo(new Date("2026-03-10T13:00:00Z"));

	await submit.execute({
		kind: "franchise",
		name: "João Lima",
		email: "joao@exemplo.com",
		phone: "(86) 98897-0955",
		city: "Teresina",
	});

	return { leads, useCase: new ListLeads(leads) };
}

describe("ListLeads", () => {
	it("devolve o mais recente primeiro", async () => {
		const { useCase } = await setup();

		const result = await useCase.execute();

		expect(result.items.map((lead) => lead.name)).toEqual([
			"João Lima",
			"Maria Souza",
		]);
		expect(result.total).toBe(2);
	});

	it("filtra por origem do formulário", async () => {
		const { useCase } = await setup();

		const result = await useCase.execute({ kind: "franchise" });

		expect(result.total).toBe(1);
		expect(result.items[0]?.kind).toBe("franchise");
	});

	it("busca por nome e por e-mail", async () => {
		const { useCase } = await setup();

		expect((await useCase.execute({ search: "maria" })).total).toBe(1);
		expect((await useCase.execute({ search: "joao@exemplo" })).total).toBe(1);
		expect((await useCase.execute({ search: "  " })).total).toBe(2);
	});

	it("limita o pageSize para a exportação não derrubar o servidor", async () => {
		const { useCase } = await setup();

		const result = await useCase.execute({ pageSize: 999_999 });

		expect(result.pageSize).toBe(5000);
	});
});
