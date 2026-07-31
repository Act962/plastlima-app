import { describe, expect, it } from "vitest";
import { PhoneNumber } from "./phone-number";

describe("PhoneNumber.create", () => {
	// A campanha inteira depende desta tabela: todas as formas que uma pessoa
	// digita o mesmo telefone precisam colapsar no mesmo `value`, senão ela
	// consegue se cadastrar duas vezes.
	const equivalentInputs = [
		"86988970955",
		"(86) 98897-0955",
		"86 9 8897-0955",
		"+55 86 98897-0955",
		"5586988970955",
		"  86988970955  ",
		"86.98897.0955",
	];

	it.each(equivalentInputs)("normaliza %j para o mesmo E.164", (input) => {
		const result = PhoneNumber.create(input);

		expect(result.ok).toBe(true);

		if (result.ok) {
			expect(result.value.value).toBe("5586988970955");
			expect(result.value.display).toBe("(86) 98897-0955");
		}
	});

	it("aceita telefone fixo de 10 dígitos", () => {
		const result = PhoneNumber.create("(86) 3221-0955");

		expect(result.ok).toBe(true);

		if (result.ok) {
			expect(result.value.value).toBe("558632210955");
			expect(result.value.display).toBe("(86) 3221-0955");
		}
	});

	const invalidInputs: [string, string][] = [
		["", "informe o número"],
		["abc", "informe o número"],
		["123", "10 ou 11 dígitos"],
		["558698897", "10 ou 11 dígitos"],
		["8698897095512", "código de país não reconhecido"],
		["2098897095", "DDD 20 não existe"],
		["3698897095", "DDD 36 não existe"],
		["86888970955", "celular deve começar com 9"],
		["8612345678", "número fixo inválido"],
		["1186988970955", "código de país não reconhecido"],
	];

	it.each(invalidInputs)("rejeita %j", (input, expectedReason) => {
		const result = PhoneNumber.create(input);

		expect(result.ok).toBe(false);

		if (!result.ok) {
			expect(result.error.code).toBe("INVALID_PHONE");
			expect(result.error.reason).toContain(expectedReason);
		}
	});
});

describe("PhoneNumber.mask", () => {
	const cases: [string, string][] = [
		["", ""],
		["8", "8"],
		["86", "86"],
		["869", "(86) 9"],
		["86988", "(86) 988"],
		["869889", "(86) 9889"],
		["8698897", "(86) 9889-7"],
		["8632210955", "(86) 3221-0955"],
		["86988970955", "(86) 98897-0955"],
		["869889709559999", "(86) 98897-0955"],
		// Número colado em formato internacional: o 55 do país é descartado.
		["+55 86 98897-0955", "(86) 98897-0955"],
		["5586988970955", "(86) 98897-0955"],
		["558632210955", "(86) 3221-0955"],
		// 55 também é DDD (Santa Maria/RS): com 10 ou 11 dígitos, não é país.
		["5599887766", "(55) 9988-7766"],
		["55998877665", "(55) 99887-7665"],
	];

	it.each(cases)("formata %j como %j", (input, expected) => {
		expect(PhoneNumber.mask(input)).toBe(expected);
	});
});

describe("PhoneNumber.restore", () => {
	it("reconstitui a partir do valor persistido", () => {
		const restored = PhoneNumber.restore("5586988970955");

		expect(restored.display).toBe("(86) 98897-0955");
	});

	it("lança quando o dado persistido está corrompido", () => {
		expect(() => PhoneNumber.restore("123")).toThrow(/formato inválido/);
	});
});
