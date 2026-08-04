import { describe, expect, it } from "vitest";
import type { AboutRichTextSegment } from "./about";
import { markdownToSegments, segmentsToMarkdown } from "./rich-text";

describe("segmentsToMarkdown", () => {
	it("envolve trechos com ênfase em **", () => {
		const segments: AboutRichTextSegment[] = [
			"A empresa ",
			{ text: "começou em 2002", emphasis: true },
			" em Teresina.",
		];

		expect(segmentsToMarkdown(segments)).toBe(
			"A empresa **começou em 2002** em Teresina.",
		);
	});
});

describe("markdownToSegments", () => {
	it("separa o negrito do texto puro", () => {
		expect(
			markdownToSegments("A empresa **começou em 2002** em Teresina."),
		).toEqual([
			"A empresa ",
			{ text: "começou em 2002", emphasis: true },
			" em Teresina.",
		]);
	});

	it("funde trechos de texto puro vizinhos e descarta vazios", () => {
		// "**oi**" no início não deixa string vazia antes dele.
		expect(markdownToSegments("**oi** mundo")).toEqual([
			{ text: "oi", emphasis: true },
			" mundo",
		]);
	});

	it("texto sem negrito vira um único segmento string", () => {
		expect(markdownToSegments("sem ênfase alguma")).toEqual([
			"sem ênfase alguma",
		]);
	});
});

describe("ida e volta", () => {
	it("preserva o conteúdo (markdown → segmentos → markdown)", () => {
		const markdown =
			"Foi **em 2007** que demos um **grande salto** na história.";

		expect(segmentsToMarkdown(markdownToSegments(markdown))).toBe(markdown);
	});
});
