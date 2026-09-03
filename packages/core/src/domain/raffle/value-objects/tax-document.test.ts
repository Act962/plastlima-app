import { describe, expect, it } from "vitest";
import { TaxDocument } from "./tax-document";

describe("TaxDocument.create", () => {
	it("aceita CPF válido com e sem formatação, normalizando para dígitos", () => {
		const formatted = TaxDocument.create("529.982.247-25");
		const raw = TaxDocument.create("52998224725");

		expect(formatted.ok).toBe(true);
		expect(raw.ok).toBe(true);

		if (!formatted.ok || !raw.ok) {
			return;
		}

		expect(formatted.value.value).toBe("52998224725");
		expect(formatted.value.value).toBe(raw.value.value);
		expect(formatted.value.display).toBe("529.982.247-25");
		expect(formatted.value.kind).toBe("cpf");
	});

	it("aceita CNPJ válido e o identifica como tal", () => {
		const result = TaxDocument.create("11.222.333/0001-81");

		expect(result.ok).toBe(true);

		if (!result.ok) {
			return;
		}

		expect(result.value.value).toBe("11222333000181");
		expect(result.value.display).toBe("11.222.333/0001-81");
		expect(result.value.kind).toBe("cnpj");
	});

	it("recusa documento com dígito verificador errado", () => {
		expect(TaxDocument.create("529.982.247-26").ok).toBe(false);
		expect(TaxDocument.create("11.222.333/0001-82").ok).toBe(false);
	});

	// Passam no cálculo do módulo 11, mas não são documentos reais — é o caso que
	// alguém digita para "preencher qualquer coisa".
	it("recusa sequências de dígitos repetidos", () => {
		expect(TaxDocument.create("111.111.111-11").ok).toBe(false);
		expect(TaxDocument.create("11.111.111/1111-11").ok).toBe(false);
	});

	it("recusa comprimento que não é de CPF nem de CNPJ", () => {
		expect(TaxDocument.create("123").ok).toBe(false);
		expect(TaxDocument.create("529982247250").ok).toBe(false);
		expect(TaxDocument.create("").ok).toBe(false);
	});
});

describe("TaxDocument.mask", () => {
	it("formata progressivamente como CPF até 11 dígitos", () => {
		expect(TaxDocument.mask("529")).toBe("529");
		expect(TaxDocument.mask("529982")).toBe("529.982");
		expect(TaxDocument.mask("529982247")).toBe("529.982.247");
		expect(TaxDocument.mask("52998224725")).toBe("529.982.247-25");
	});

	it("vira CNPJ a partir do 12º dígito", () => {
		expect(TaxDocument.mask("112223330001")).toBe("11.222.333/0001");
		expect(TaxDocument.mask("11222333000181")).toBe("11.222.333/0001-81");
	});

	it("descarta o que passa de 14 dígitos e ignora o que não é dígito", () => {
		expect(TaxDocument.mask("11222333000181999")).toBe("11.222.333/0001-81");
		expect(TaxDocument.mask("abc529982247-25")).toBe("529.982.247-25");
	});
});

describe("TaxDocument.restore", () => {
	it("reconstitui a partir dos dígitos persistidos", () => {
		expect(TaxDocument.restore("52998224725").display).toBe("529.982.247-25");
	});

	// Documento inválido vindo do nosso banco é corrupção, não entrada de usuário.
	it("lança quando o valor persistido é inválido", () => {
		expect(() => TaxDocument.restore("52998224726")).toThrow();
	});
});
