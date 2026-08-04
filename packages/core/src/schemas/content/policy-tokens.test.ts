import { describe, expect, it } from "vitest";
import {
	findUnknownPolicyTokens,
	type PolicyTokenValues,
	renderPolicyTokens,
	resolvePolicyTokens,
} from "./policy-tokens";
import type { PrivacyPolicyContent } from "./privacy-policy";

const values: PolicyTokenValues = {
	"site.name": "Plastlima",
	"site.address": "Teresina-PI",
	"site.email": "contato@plastlima.com",
	"site.franchiseEmail": "franquia@plastlima.com",
	"contact.support.display": "86 99554-8646",
};

describe("renderPolicyTokens", () => {
	it("troca os tokens conhecidos pelos valores", () => {
		expect(
			renderPolicyTokens("Fale com a {{site.name}} em {{site.email}}.", values),
		).toBe("Fale com a Plastlima em contato@plastlima.com.");
	});

	it("tolera espaços dentro das chaves", () => {
		expect(renderPolicyTokens("{{ site.name }}", values)).toBe("Plastlima");
	});

	it("deixa tokens desconhecidos intactos", () => {
		expect(renderPolicyTokens("{{site.cnpj}}", values)).toBe("{{site.cnpj}}");
	});
});

describe("findUnknownPolicyTokens", () => {
	it("lista só os tokens que não existem, sem repetir", () => {
		expect(
			findUnknownPolicyTokens("{{site.name}} {{site.cnpj}} {{site.cnpj}}"),
		).toEqual(["site.cnpj"]);
	});

	it("não acusa nada quando todos são válidos", () => {
		expect(findUnknownPolicyTokens("{{site.email}} e {{site.name}}")).toEqual(
			[],
		);
	});
});

describe("resolvePolicyTokens", () => {
	it("resolve os tokens em toda a estrutura do documento", () => {
		const content: PrivacyPolicyContent = {
			updatedAt: "1 de janeiro de 2026",
			intro: ["A {{site.name}} respeita sua privacidade."],
			sections: [
				{
					id: "contato",
					title: "Fale com a {{site.name}}",
					blocks: [
						{ type: "paragraph", text: "Escreva para {{site.email}}." },
						{
							type: "list",
							lead: "Canais da {{site.name}}:",
							items: ["WhatsApp {{contact.support.display}}"],
						},
					],
				},
			],
		};

		const resolved = resolvePolicyTokens(content, values);

		expect(resolved.intro[0]).toBe("A Plastlima respeita sua privacidade.");
		expect(resolved.sections[0]?.title).toBe("Fale com a Plastlima");
		const [paragraph, list] = resolved.sections[0]?.blocks ?? [];
		expect(paragraph).toEqual({
			type: "paragraph",
			text: "Escreva para contato@plastlima.com.",
		});
		expect(list).toEqual({
			type: "list",
			lead: "Canais da Plastlima:",
			items: ["WhatsApp 86 99554-8646"],
		});
	});
});
