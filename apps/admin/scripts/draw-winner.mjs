/**
 * Apura o ganhador da campanha pelo terminal e grava a ata em arquivo.
 *
 * É o mesmo sorteio da tela `/sorteio` do painel: a conta vem de
 * `@plastlima-app/core/raffle-draw`, importada aqui em vez de reimplementada —
 * duas implementações do mesmo sorteio poderiam apontar ganhadores diferentes,
 * que é o pior defeito possível neste código. A tela existe para conduzir o
 * sorteio com o cliente junto; este script existe para quando é preciso apurar
 * sem navegador, e porque ele deixa a ata gravada em disco.
 *
 * **Só lê o banco.** Nenhuma escrita — pode rodar contra a produção sem risco, e
 * quantas vezes for preciso: com a mesma semente e a mesma base, o resultado é
 * sempre o mesmo.
 *
 * A semente precisa ser um valor público definido DEPOIS do fim das inscrições,
 * para ninguém poder escolher a semente que dá o ganhador desejado. O padrão de
 * mercado é o resultado da Loteria Federal do dia, ex.:
 * `--semente="LF-5987-31/08/2026-12345"`.
 *
 * Uso:
 *   pnpm run draw:winner -- --semente="ensaio"            # base local
 *   pnpm run draw:winner:prod -- --semente="LF-5987-…"    # Atlas (.env.atlas)
 *
 * Opções:
 *   --semente=<texto>     obrigatória; valor público que origina o sorteio
 *   --criterio=simples    1 pessoa = 1 chance (padrão, decisão do cliente)
 *   --criterio=ponderado  bilhetes = participationCount (regulamento §5)
 *   --suplentes=<n>       quantos suplentes sortear (padrão 3)
 *   --grupo=cd            apura só os clientes do Centro de Distribuição
 *   --grupo=unidades      apura só os clientes das lojas
 *   --campanha=<id>       campanha alvo (padrão tv-42-2026)
 *   --ate=<ISO>           só cadastros até esta data (padrão: fim das inscrições)
 *   --excluir=<telefones> lista separada por vírgula, desclassificados
 *   --saida=<arquivo>     caminho da ata (padrão atas/ata-<campanha>.json; o
 *                         ensaio contra o banco local grava `-ensaio.json`)
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	buildDrawRecord,
	drawOrder,
	parsePhoneList,
	splitByEligibility,
} from "@plastlima-app/core/raffle-draw";
import { PrismaClient } from "@prisma/client";

const DEFAULT_CAMPAIGN_ID = "tv-42-2026";
const DEFAULT_SUBSTITUTES = 3;

/**
 * Fim das inscrições, conforme o regulamento oficial (30/08/2026, horário de
 * Brasília). Duplica `apps/web/src/data/raffle.ts` pelo mesmo motivo do
 * `ADMIN_CAMPAIGN`: o painel não depende do app público.
 */
const DEFAULT_ENTRIES_CLOSE_AT = "2026-08-30T23:59:59-03:00";

const scriptDir = dirname(fileURLToPath(import.meta.url));

function readArg(name) {
	const prefix = `--${name}=`;
	const match = process.argv.find((arg) => arg.startsWith(prefix));

	return match === undefined ? undefined : match.slice(prefix.length);
}

function abort(message) {
	console.error(message);
	process.exit(1);
}

const seed = readArg("semente");

if (seed === undefined || seed.trim().length === 0) {
	abort(
		"Informe a semente do sorteio: --semente=<valor público>\n" +
			"Use um valor definido depois do fim das inscrições e verificável por\n" +
			'terceiros — ex.: --semente="LF-5987-31/08/2026-12345" (Loteria Federal).',
	);
}

const criterion = readArg("criterio") ?? "simples";

if (criterion !== "simples" && criterion !== "ponderado") {
	abort("--criterio precisa ser 'simples' ou 'ponderado'.");
}

const substitutes = Number.parseInt(readArg("suplentes") ?? "", 10);
const substituteCount = Number.isNaN(substitutes)
	? DEFAULT_SUBSTITUTES
	: substitutes;

if (substituteCount < 0) {
	abort("--suplentes não pode ser negativo.");
}

const campaignId = readArg("campanha") ?? DEFAULT_CAMPAIGN_ID;

// A campanha entrega uma TV por grupo: apurar sem escolher misturaria as duas
// bases num sorteio só, o que daria o ganhador errado nos dois prêmios.
const pool = readArg("grupo");

if (pool !== "cd" && pool !== "unidades") {
	abort(
		"Informe o grupo a apurar: --grupo=cd ou --grupo=unidades.\n" +
			"  Cada grupo tem seu próprio prêmio e sua própria apuração.",
	);
}
const cutoff = new Date(readArg("ate") ?? DEFAULT_ENTRIES_CLOSE_AT);

if (Number.isNaN(cutoff.getTime())) {
	abort("--ate precisa ser uma data ISO válida.");
}

/** Descarta usuário e senha: nada de credencial na ata nem no log. */
function describeTarget(url) {
	if (!url) {
		return null;
	}

	try {
		return new URL(url).host;
	} catch {
		return null;
	}
}

const host = describeTarget(process.env.DATABASE_URL);

if (host === null) {
	abort("DATABASE_URL ausente ou em formato inválido.");
}

const isRehearsal =
	host.startsWith("localhost") || host.startsWith("127.0.0.1");

/**
 * O ensaio contra o banco local grava num arquivo à parte.
 *
 * Sem isso, o ensaio ocuparia o caminho padrão e a apuração de verdade seria
 * recusada pela proteção logo abaixo — justamente no dia do sorteio.
 */
const outputPath =
	readArg("saida") ??
	join(
		scriptDir,
		"..",
		"atas",
		isRehearsal
			? `ata-${campaignId}-${pool}-ensaio.json`
			: `ata-${campaignId}-${pool}.json`,
	);

if (existsSync(outputPath)) {
	abort(
		`Já existe uma ata em ${outputPath}.\n` +
			"Uma ata é registro de apuração e não deve ser sobrescrita — informe\n" +
			"outro caminho com --saida=<arquivo> se a intenção é refazer o sorteio.",
	);
}

const prisma = new PrismaClient();

try {
	console.info(`Lendo ${host} (campanha ${campaignId}, grupo ${pool})`);

	// Mesma projeção do `listForDraw` do repositório: sem `receiptImage`, que são
	// data URLs de até 800 mil caracteres e não interessam à apuração.
	const candidates = await prisma.participant.findMany({
		// "unidades" precisa aceitar `pool: null`: os cadastros da campanha
		// anterior são anteriores ao campo, e todos eram de loja.
		where: {
			campaignId,
			...(pool === "unidades"
				? { OR: [{ pool: "unidades" }, { pool: null }] }
				: { pool }),
		},
		orderBy: { createdAt: "asc" },
		select: {
			name: true,
			phone: true,
			phoneDisplay: true,
			storeName: true,
			city: true,
			state: true,
			participationCount: true,
			createdAt: true,
		},
	});

	const split = splitByEligibility(candidates, {
		cutoff,
		excluded: parsePhoneList(readArg("excluir") ?? ""),
	});

	if (split.eligible.length === 0) {
		abort("Nenhum participante elegível — nada a sortear.");
	}

	const order = drawOrder(seed, split.eligible, criterion);

	const record = buildDrawRecord({
		campaignId,
		pool,
		seed,
		criterion,
		cutoff,
		now: new Date(),
		split,
		order,
		substitutes: substituteCount,
	});

	mkdirSync(dirname(outputPath), { recursive: true });
	writeFileSync(outputPath, `${JSON.stringify(record, null, "\t")}\n`, "utf8");

	console.info("");
	console.info(`Grupo:         ${record.grupo}`);
	console.info(`Critério:      ${record.criterio}`);
	console.info(`Semente:       ${seed}`);
	console.info(
		`Elegíveis:     ${record.totais.elegiveis} participantes / ${record.totais.bilhetes} bilhetes`,
	);

	if (record.totais.foraDoPrazo > 0) {
		console.info(
			`Fora do prazo: ${record.totais.foraDoPrazo} (não concorreram)`,
		);
	}

	if (record.totais.desclassificados > 0) {
		console.info(`Desclassificados: ${record.totais.desclassificados}`);
	}

	console.info("");
	console.info(
		`GANHADOR: ${record.ganhador.nome} — ${record.ganhador.whatsapp} — ${record.ganhador.loja} (${record.ganhador.cidade})`,
	);

	record.suplentes.forEach((entry, index) => {
		console.info(
			`${index + 1}º suplente: ${entry.nome} — ${entry.whatsapp} — ${entry.loja} (${entry.cidade})`,
		);
	});

	console.info("");
	console.info(`Ata gravada em ${outputPath}`);
} finally {
	await prisma.$disconnect();
}
