import { describe, expect, it } from "vitest";
import { FixedClock, InMemoryLeadRepository } from "../../testing";
import { SubmitLead } from "./submit-lead";

const NOW = new Date("2026-03-10T12:00:00Z");

function setup() {
	const leads = new InMemoryLeadRepository();
	const useCase = new SubmitLead(leads, new FixedClock(NOW));

	return { leads, useCase };
}

const CONTACT = {
	kind: "contact" as const,
	name: "Maria Souza",
	email: "maria@exemplo.com",
	message: "Gostaria de saber os horários de entrega.",
};

const FRANCHISE = {
	kind: "franchise" as const,
	name: "João Lima",
	email: "joao@exemplo.com",
	phone: "(86) 98897-0955",
	state: "PI",
	city: "Teresina",
};

describe("SubmitLead", () => {
	it("grava uma mensagem de contato como nova", async () => {
		const { leads, useCase } = setup();

		const result = await useCase.execute(CONTACT);

		expect(result.ok).toBe(true);
		expect(leads.size).toBe(1);

		const stored = await leads.findById(result.ok ? result.value.id : "");

		expect(stored?.toSnapshot()).toMatchObject({
			kind: "contact",
			name: "Maria Souza",
			email: "maria@exemplo.com",
			status: "new",
			createdAt: NOW,
			handledAt: null,
			handledBy: null,
		});
	});

	it("guarda cidade e estado do lead de franquia", async () => {
		const { leads, useCase } = setup();

		const result = await useCase.execute(FRANCHISE);
		const stored = await leads.findById(result.ok ? result.value.id : "");

		expect(stored?.toSnapshot()).toMatchObject({
			kind: "franchise",
			phone: "(86) 98897-0955",
			state: "PI",
			city: "Teresina",
			message: null,
		});
	});

	it("normaliza o nome e o e-mail antes de gravar", async () => {
		const { leads, useCase } = setup();

		const result = await useCase.execute({
			...CONTACT,
			name: "  Maria   Souza ",
			email: "  Maria@Exemplo.COM ",
		});

		const stored = await leads.findById(result.ok ? result.value.id : "");

		expect(stored?.name).toBe("Maria Souza");
		expect(stored?.email).toBe("maria@exemplo.com");
	});

	it("recusa e-mail em formato inválido", async () => {
		const { leads, useCase } = setup();

		const result = await useCase.execute({ ...CONTACT, email: "maria" });

		expect(result.ok).toBe(false);
		expect(result.ok === false && result.error.code).toBe("INVALID_LEAD");
		expect(leads.size).toBe(0);
	});

	it("recusa lead de franquia sem telefone", async () => {
		const { useCase } = setup();

		const result = await useCase.execute({ ...FRANCHISE, phone: "  " });

		expect(result.ok).toBe(false);
	});

	it("recusa contato sem mensagem", async () => {
		const { useCase } = setup();

		const result = await useCase.execute({ ...CONTACT, message: "" });

		expect(result.ok).toBe(false);
	});

	it("recusa mensagem acima do limite em vez de truncar", async () => {
		const { useCase } = setup();

		const result = await useCase.execute({
			...CONTACT,
			message: "a".repeat(5001),
		});

		expect(result.ok).toBe(false);
		expect(result.ok === false && result.error.reason).toContain("mensagem");
	});

	it("aceita duas mensagens da mesma pessoa — não há deduplicação", async () => {
		const { leads, useCase } = setup();

		await useCase.execute(CONTACT);
		await useCase.execute({ ...CONTACT, message: "Outra dúvida, obrigada." });

		expect(leads.size).toBe(2);
	});
});
