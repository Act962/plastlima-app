import { describe, expect, it } from "vitest";
import {
	buildDrawRecord,
	type DrawCandidate,
	drawOrder,
	nationalDigits,
	parsePhoneList,
	splitByEligibility,
	ticketFor,
	universeHash,
} from "./draw";

const CUTOFF = new Date("2026-08-30T23:59:59-03:00");

function candidate(
	phone: string,
	overrides: Partial<DrawCandidate> = {},
): DrawCandidate {
	return {
		name: `Participante ${phone.slice(-4)}`,
		phone,
		phoneDisplay: phone,
		storeName: "Loja Centro",
		city: "Teresina",
		state: "Piauí",
		participationCount: 1,
		createdAt: new Date("2026-08-10T12:00:00-03:00"),
		...overrides,
	};
}

/** Base de tamanho suficiente para as asserções estatísticas não serem frágeis. */
function population(size: number): DrawCandidate[] {
	return Array.from({ length: size }, (_, index) =>
		candidate(`5586${String(988000000 + index)}`),
	);
}

describe("ticketFor", () => {
	// Vetor fixo: se este valor mudar, toda apuração já divulgada deixa de ser
	// reproduzível. Qualquer alteração na fórmula precisa quebrar este teste.
	it("é estável para uma dada semente e telefone", () => {
		expect(ticketFor("semente-oficial", "5586988970955", 1)).toBe(
			"4003df3511084930c470223233ab068138c58632984031ac63f9de4cbb80132d",
		);
	});

	it("muda com a semente, com o telefone e com o número do bilhete", () => {
		const base = ticketFor("a", "5586988970955", 1);

		expect(ticketFor("b", "5586988970955", 1)).not.toBe(base);
		expect(ticketFor("a", "5586988970956", 1)).not.toBe(base);
		expect(ticketFor("a", "5586988970955", 2)).not.toBe(base);
	});
});

describe("drawOrder", () => {
	it("devolve sempre a mesma ordem para a mesma semente", () => {
		const people = population(50);

		const first = drawOrder("loteria-5987", people).map((one) => one.phone);
		const second = drawOrder("loteria-5987", people).map((one) => one.phone);

		expect(first).toEqual(second);
	});

	it("não depende da ordem em que os participantes chegaram", () => {
		const people = population(50);
		const reversed = [...people].reverse();

		expect(drawOrder("x", people).map((one) => one.phone)).toEqual(
			drawOrder("x", reversed).map((one) => one.phone),
		);
	});

	it("troca o ganhador quando a semente muda", () => {
		const people = population(50);

		const winners = new Set(
			["a", "b", "c", "d", "e"].map(
				(seed) => drawOrder(seed, people)[0]?.phone,
			),
		);

		expect(winners.size).toBeGreaterThan(1);
	});

	it("dá um bilhete por pessoa no critério simples", () => {
		const people = [candidate("5586988970955", { participationCount: 7 })];

		expect(drawOrder("x", people, "simples")[0]?.tickets).toBe(1);
	});

	it("dá um bilhete por cadastro no critério ponderado", () => {
		const people = [candidate("5586988970955", { participationCount: 7 })];

		expect(drawOrder("x", people, "ponderado")[0]?.tickets).toBe(7);
	});

	/**
	 * A promessa do critério ponderado é "mais cadastros, mais chance". Sortear
	 * mil sementes diferentes e contar quantas vezes cada um vence mostra que a
	 * vantagem existe de fato, e não só na intenção.
	 */
	it("favorece quem tem mais cadastros no critério ponderado", () => {
		const people = [
			candidate("5586988970001", { participationCount: 1 }),
			candidate("5586988970002", { participationCount: 10 }),
		];

		let heavyWins = 0;

		for (let round = 0; round < 1000; round += 1) {
			if (
				drawOrder(`rodada-${round}`, people, "ponderado")[0]?.phone ===
				people[1]?.phone
			) {
				heavyWins += 1;
			}
		}

		// Esperado ~909 (10 de 11 bilhetes); a folga cobre a variação da amostra.
		expect(heavyWins).toBeGreaterThan(830);
		expect(heavyWins).toBeLessThan(970);
	});

	it("não favorece ninguém no critério simples", () => {
		const people = [
			candidate("5586988970001", { participationCount: 1 }),
			candidate("5586988970002", { participationCount: 10 }),
		];

		let heavyWins = 0;

		for (let round = 0; round < 1000; round += 1) {
			if (drawOrder(`rodada-${round}`, people)[0]?.phone === people[1]?.phone) {
				heavyWins += 1;
			}
		}

		expect(heavyWins).toBeGreaterThan(430);
		expect(heavyWins).toBeLessThan(570);
	});

	it("mantém a ordem dos demais quando o ganhador sai da lista", () => {
		const people = population(20);
		const full = drawOrder("x", people);
		const winner = full[0];

		if (winner === undefined) {
			throw new Error("lista vazia");
		}

		const withoutWinner = drawOrder(
			"x",
			people.filter((one) => one.phone !== winner.phone),
		);

		expect(withoutWinner.map((one) => one.phone)).toEqual(
			full.slice(1).map((one) => one.phone),
		);
	});
});

describe("splitByEligibility", () => {
	it("separa quem se cadastrou depois do fim das inscrições", () => {
		const inTime = candidate("5586988970001");
		const late = candidate("5586988970002", {
			createdAt: new Date("2026-08-31T10:00:00-03:00"),
		});

		const split = splitByEligibility([inTime, late], { cutoff: CUTOFF });

		expect(split.eligible).toEqual([inTime]);
		expect(split.afterCutoff).toEqual([late]);
	});

	it("desclassifica pelo telefone, em qualquer formato", () => {
		const people = [candidate("5586988970955"), candidate("5586988970002")];

		const split = splitByEligibility(people, {
			cutoff: CUTOFF,
			excluded: parsePhoneList("(86) 98897-0955"),
		});

		expect(split.disqualified.map((one) => one.phone)).toEqual([
			"5586988970955",
		]);
		expect(split.eligible).toHaveLength(1);
	});

	it("conta a desclassificação uma vez só, mesmo fora do prazo", () => {
		const late = candidate("5586988970955", {
			createdAt: new Date("2026-09-02T10:00:00-03:00"),
		});

		const split = splitByEligibility([late], {
			cutoff: CUTOFF,
			excluded: parsePhoneList("5586988970955"),
		});

		expect(split.disqualified).toHaveLength(1);
		expect(split.afterCutoff).toHaveLength(0);
	});
});

describe("nationalDigits", () => {
	it.each([
		["86988970955", "86988970955"],
		["(86) 98897-0955", "86988970955"],
		["+55 86 98897-0955", "86988970955"],
		["5586988970955", "86988970955"],
		["8632210955", "8632210955"],
	])("normaliza %j", (input, expected) => {
		expect(nationalDigits(input)).toBe(expected);
	});
});

describe("universeHash", () => {
	it("não muda com a ordem da lista", () => {
		const people = population(10);

		expect(universeHash(drawOrder("x", people))).toBe(
			universeHash(drawOrder("x", [...people].reverse())),
		);
	});

	it("muda quando alguém entra ou sai da lista", () => {
		const people = population(10);
		const base = universeHash(drawOrder("x", people));

		expect(universeHash(drawOrder("x", people.slice(1)))).not.toBe(base);
	});
});

describe("buildDrawRecord", () => {
	const now = new Date("2026-08-31T15:00:00-03:00");

	function record(size: number) {
		const people = population(size);
		const split = splitByEligibility(people, { cutoff: CUTOFF });

		return buildDrawRecord({
			campaignId: "kit-churrasco-2026",
			pool: "unidades",
			seed: "loteria-5987",
			criterion: "simples",
			cutoff: CUTOFF,
			now,
			split,
			order: drawOrder("loteria-5987", split.eligible),
			substitutes: 3,
		});
	}

	it("registra critério, semente e totais", () => {
		const ata = record(10);

		expect(ata.criterio).toBe("simples (1 pessoa = 1 chance)");
		expect(ata.semente).toBe("loteria-5987");
		expect(ata.totais).toEqual({
			cadastrados: 10,
			foraDoPrazo: 0,
			desclassificados: 0,
			elegiveis: 10,
			bilhetes: 10,
		});
	});

	it("traz o ganhador e os suplentes na ordem do sorteio", () => {
		const ata = record(10);

		expect(ata.suplentes).toHaveLength(3);
		expect(ata.ganhador.bilhete < (ata.suplentes[0]?.bilhete ?? "")).toBe(true);
	});

	it("limita os suplentes ao que existe de participante", () => {
		expect(record(2).suplentes).toHaveLength(1);
	});

	it("recusa montar ata sem ninguém elegível", () => {
		expect(() => record(0)).toThrow(/elegíveis/);
	});
});
