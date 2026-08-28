import { createHash } from "node:crypto";

/**
 * Núcleo da apuração do sorteio: determinístico, puro e verificável.
 *
 * O bilhete de cada participante é `sha256(semente|telefone|n)` e vence o menor.
 * Duas consequências que são o motivo de existir deste módulo:
 *
 * 1. **Qualquer pessoa refaz a conta.** Com a semente e a lista exportada em
 *    CSV, um terceiro chega ao mesmo ganhador sem acesso ao nosso banco — é o
 *    que sustenta a divulgação do resultado (regulamento §7).
 * 2. **Não existe "sortear de novo até gostar".** Mesma semente e mesma base
 *    devolvem sempre o mesmo nome, então a apuração pode ser repetida à vontade
 *    sem mudar o resultado.
 *
 * A semente precisa ser um valor público definido **depois** do fim das
 * inscrições (o padrão de mercado é o resultado da Loteria Federal do dia);
 * do contrário, quem apura poderia procurar a semente que dá o nome desejado.
 *
 * Fica em `domain/` porque é regra de negócio, não detalhe de tela: o mesmo
 * código roda no painel e no script de apuração, e é o que garante que os dois
 * chegam ao mesmo ganhador. `node:crypto` é a única dependência — este módulo
 * não é importado por componente de cliente.
 */

/**
 * Critério de apuração.
 *
 * `simples` é a decisão vigente do cliente ("dar oportunidade para todo mundo");
 * `ponderado` existe porque a cláusula 5 do regulamento promete mais chances a
 * quem compra mais, e a escolha precisa ser registrável na ata.
 */
export type DrawCriterion = "simples" | "ponderado";

/** O que a apuração precisa saber de cada participante. */
export type DrawCandidate = {
	name: string;
	/** E.164 sem o `+`. É a identidade da pessoa e a entrada do bilhete. */
	phone: string;
	phoneDisplay: string;
	storeName: string;
	city: string;
	state: string;
	participationCount: number;
	createdAt: Date;
};

export type DrawnCandidate = DrawCandidate & {
	/** Quantos bilhetes a pessoa recebeu no critério usado. */
	tickets: number;
	/** O melhor (menor) bilhete dela. */
	ticket: string;
};

export type EligibilitySplit = {
	eligible: DrawCandidate[];
	afterCutoff: DrawCandidate[];
	disqualified: DrawCandidate[];
};

export type DrawRecord = {
	campanha: string;
	criterio: string;
	semente: string;
	apuradoEm: string;
	inscricoesAte: string;
	totais: {
		cadastrados: number;
		foraDoPrazo: number;
		desclassificados: number;
		elegiveis: number;
		bilhetes: number;
	};
	hashDoUniverso: string;
	ganhador: DrawnParticipantRecord;
	suplentes: DrawnParticipantRecord[];
	desclassificados: { nome: string; whatsapp: string }[];
	comoVerificar: string;
};

type DrawnParticipantRecord = {
	nome: string;
	whatsapp: string;
	whatsappE164: string;
	loja: string;
	cidade: string;
	cadastros: number;
	bilhetes: number;
	bilhete: string;
	cadastradoEm: string;
};

const CRITERION_LABELS: Record<DrawCriterion, string> = {
	simples: "simples (1 pessoa = 1 chance)",
	ponderado: "ponderado por número de cadastros",
};

const HOW_TO_VERIFY =
	"bilhete = sha256('<semente>|<telefone E.164>|<n>'), n de 1 até o número de " +
	"bilhetes; cada pessoa fica com o menor dos seus bilhetes e vence o menor de " +
	"todos.";

/**
 * Número nacional (DDD + assinante), como o `PhoneNumber` normaliza.
 *
 * Permite comparar um telefone digitado à mão com o que está no banco sem
 * exigir formato. O limiar é > 11 porque 55 também é DDD válido (Santa Maria).
 */
export function nationalDigits(raw: string): string {
	const digits = raw.replace(/\D/g, "");

	return digits.length > 11 && digits.startsWith("55")
		? digits.slice(2)
		: digits;
}

/** Lê uma lista de telefones separados por vírgula, ponto e vírgula ou quebra de linha. */
export function parsePhoneList(raw: string): Set<string> {
	return new Set(
		raw
			.split(/[,;\n]/)
			.map(nationalDigits)
			.filter((digits) => digits.length > 0),
	);
}

/**
 * Separa quem concorre de quem não concorre.
 *
 * Cadastro gravado depois do fim das inscrições não entra: na prática a Server
 * Action do site já recusa, e o filtro cobre o caso de o prazo ter sido esticado
 * sem que a apuração soubesse. Desclassificação é decisão humana (regulamento
 * §3 e §9) e chega pronta em `excluded`.
 */
export function splitByEligibility(
	candidates: DrawCandidate[],
	options: { cutoff: Date; excluded?: Set<string> },
): EligibilitySplit {
	const excluded = options.excluded ?? new Set<string>();
	const split: EligibilitySplit = {
		eligible: [],
		afterCutoff: [],
		disqualified: [],
	};

	for (const candidate of candidates) {
		if (excluded.has(nationalDigits(candidate.phone))) {
			split.disqualified.push(candidate);
			continue;
		}

		if (candidate.createdAt.getTime() > options.cutoff.getTime()) {
			split.afterCutoff.push(candidate);
			continue;
		}

		split.eligible.push(candidate);
	}

	return split;
}

/** O bilhete de número `index` de um telefone, para uma dada semente. */
export function ticketFor(seed: string, phone: string, index: number): string {
	return createHash("sha256").update(`${seed}|${phone}|${index}`).digest("hex");
}

function ticketCount(
	candidate: DrawCandidate,
	criterion: DrawCriterion,
): number {
	return criterion === "ponderado"
		? Math.max(1, candidate.participationCount)
		: 1;
}

/**
 * Ordena os participantes pelo resultado do sorteio: o primeiro é o ganhador, os
 * seguintes são os suplentes na ordem.
 *
 * Cada pessoa fica com o menor dos seus bilhetes. Como os hashes são uniformes,
 * ficar com o menor de N sorteios independentes dá exatamente probabilidade
 * proporcional a N — é o que faz o critério ponderado ser de fato proporcional
 * ao número de cadastros, sem repetir a pessoa na lista.
 */
export function drawOrder(
	seed: string,
	candidates: DrawCandidate[],
	criterion: DrawCriterion = "simples",
): DrawnCandidate[] {
	const drawn = candidates.map((candidate) => {
		const tickets = ticketCount(candidate, criterion);
		let ticket = ticketFor(seed, candidate.phone, 1);

		for (let index = 2; index <= tickets; index += 1) {
			const other = ticketFor(seed, candidate.phone, index);

			if (other < ticket) {
				ticket = other;
			}
		}

		return { ...candidate, tickets, ticket };
	});

	// Hashes hexadecimais de mesmo comprimento: comparar como texto equivale a
	// comparar como número. O telefone desempata para a ordem ser total mesmo no
	// caso (improvável) de dois bilhetes iguais.
	return drawn.sort((a, b) =>
		a.ticket === b.ticket
			? a.phone.localeCompare(b.phone)
			: a.ticket.localeCompare(b.ticket),
	);
}

/**
 * Impressão digital do universo sorteado.
 *
 * Quem tiver a lista exportada recalcula este hash e prova que a apuração usou
 * exatamente estes participantes — ninguém incluído nem removido depois.
 */
export function universeHash(candidates: DrawnCandidate[]): string {
	return createHash("sha256")
		.update(
			candidates
				.map((candidate) => `${candidate.phone}:${candidate.tickets}`)
				.sort()
				.join("\n"),
		)
		.digest("hex");
}

function toRecord(candidate: DrawnCandidate): DrawnParticipantRecord {
	return {
		nome: candidate.name,
		whatsapp: candidate.phoneDisplay,
		whatsappE164: candidate.phone,
		loja: candidate.storeName,
		cidade: `${candidate.city}/${candidate.state}`,
		cadastros: candidate.participationCount,
		bilhetes: candidate.tickets,
		bilhete: candidate.ticket,
		cadastradoEm: candidate.createdAt.toISOString(),
	};
}

/**
 * Monta a ata da apuração — o documento que registra o resultado e permite
 * conferi-lo depois. É o mesmo objeto no painel e no script, de propósito: a ata
 * baixada pela tela precisa ser idêntica à gravada em arquivo.
 *
 * Lança com lista vazia, em vez de devolver `Result`: "não há ninguém para
 * sortear" é condição esperada e quem chama já trata antes de chegar aqui —
 * chegar sem ganhador seria defeito de programação.
 */
export function buildDrawRecord(input: {
	campaignId: string;
	seed: string;
	criterion: DrawCriterion;
	cutoff: Date;
	now: Date;
	split: EligibilitySplit;
	order: DrawnCandidate[];
	substitutes: number;
}): DrawRecord {
	const { order, split } = input;
	const [winner] = order;

	if (winner === undefined) {
		throw new Error("Não há participantes elegíveis para montar a ata.");
	}

	return {
		campanha: input.campaignId,
		criterio: CRITERION_LABELS[input.criterion],
		semente: input.seed,
		apuradoEm: input.now.toISOString(),
		inscricoesAte: input.cutoff.toISOString(),
		totais: {
			cadastrados:
				split.eligible.length +
				split.afterCutoff.length +
				split.disqualified.length,
			foraDoPrazo: split.afterCutoff.length,
			desclassificados: split.disqualified.length,
			elegiveis: order.length,
			bilhetes: order.reduce((sum, entry) => sum + entry.tickets, 0),
		},
		hashDoUniverso: universeHash(order),
		ganhador: toRecord(winner),
		suplentes: order.slice(1, 1 + input.substitutes).map(toRecord),
		desclassificados: split.disqualified.map((candidate) => ({
			nome: candidate.name,
			whatsapp: candidate.phoneDisplay,
		})),
		comoVerificar: HOW_TO_VERIFY,
	};
}
