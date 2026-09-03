/**
 * Popula a campanha com participantes fictícios, para desenvolvimento.
 *
 * Existe porque as telas do painel (busca, paginação, miniatura do cupom,
 * exportação CSV) só mostram o que realmente são com dezenas de linhas — e a
 * única outra forma de encher a tabela é preencher o formulário do site à mão.
 *
 * Uso:
 *   pnpm run seed:participants -- --quantidade=50
 *   pnpm run seed:participants -- --limpar --quantidade=200 --semente=7
 *
 * Opções:
 *   --quantidade=<n>   quantos criar (padrão 30)
 *   --campanha=<id>    campanha alvo (padrão tv-42-2026)
 *   --dias=<n>         espalha os cadastros pelos últimos n dias (padrão 30)
 *   --semente=<n>      fixa o gerador aleatório, para repetir a mesma massa
 *   --limpar           apaga os participantes da campanha antes de inserir
 *   --forcar           libera a execução contra um banco que não é local
 */
import { PrismaClient } from "@prisma/client";

const DEFAULT_CAMPAIGN_ID = "tv-42-2026";

/**
 * Fatia dos cadastros que sai do Centro de Distribuição.
 *
 * Baixa de propósito: o CD é atacado e tem muito menos clientes que as 14
 * lojas. Uma base de teste com metade em cada grupo esconderia justamente o que
 * a apuração precisa mostrar — que os dois sorteios têm tamanhos bem diferentes.
 */
const DISTRIBUTION_CENTER_RATE = 0.12;

/**
 * Fatia dos cadastros que informa CPF/CNPJ. O campo é opcional no formulário,
 * então a base de teste precisa ter os dois casos — só assim a coluna do painel
 * mostra como ela realmente se comporta.
 */
const DOCUMENT_RATE = 0.55;
const DEFAULT_COUNT = 30;
const DEFAULT_SPREAD_DAYS = 30;
const RECEIPT_RATE = 0.4;
const DAY_IN_MS = 86_400_000;

/**
 * Lojas participantes, na forma mínima que o participante guarda.
 *
 * Duplica `apps/web/src/data/locations.ts` de propósito, pelo mesmo motivo de
 * `ADMIN_CAMPAIGN` em src/lib/participants.ts: o admin não depende do app
 * público. O que é gravado é um snapshot da loja, então uma lista desatualizada
 * não corrompe nada — só gera nomes antigos na massa de teste.
 */
/** O Centro de Distribuição não é uma das lojas: é a operação de atacado. */
const DISTRIBUTION_CENTER = {
	id: "centro-distribuicao",
	name: "Centro de Distribuição",
	city: "Teresina",
	state: "Piauí",
	pool: "cd",
};

const STORES = [
	{
		id: "pi-teresina-centro",
		name: "Loja Centro",
		city: "Teresina",
		state: "Piauí",
	},
	{
		id: "pi-teresina-parque-piaui",
		name: "Loja Parque Piauí",
		city: "Teresina",
		state: "Piauí",
	},
	{
		id: "pi-teresina-leste-homero",
		name: "Loja Leste Homero",
		city: "Teresina",
		state: "Piauí",
	},
	{
		id: "pi-teresina-ceasa",
		name: "Loja Ceasa",
		city: "Teresina",
		state: "Piauí",
	},
	{
		id: "pi-teresina-dirceu",
		name: "Loja Dirceu",
		city: "Teresina",
		state: "Piauí",
	},
	{
		id: "pi-agua-branca",
		name: "Loja Água Branca",
		city: "Água Branca",
		state: "Piauí",
	},
	{
		id: "pi-piripiri",
		name: "Loja Piripiri",
		city: "Piripiri",
		state: "Piauí",
	},
	{
		id: "pi-esperantina",
		name: "Loja Esperantina",
		city: "Esperantina",
		state: "Piauí",
	},
	{
		id: "pi-parnaiba",
		name: "Loja Parnaíba",
		city: "Parnaíba",
		state: "Piauí",
	},
	{
		id: "ma-timon-formosa",
		name: "Loja Formosa",
		city: "Timon",
		state: "Maranhão",
	},
	{
		id: "ma-timon-ceasa",
		name: "Loja Ceasa",
		city: "Timon",
		state: "Maranhão",
	},
	{
		id: "pe-ouricuri",
		name: "Loja Ouricuri",
		city: "Ouricuri",
		state: "Pernambuco",
	},
];

/** DDDs das praças onde a Plastlima tem loja (PI, MA e PE). */
const AREA_CODES = ["86", "89", "98", "99", "87", "81"];

const FIRST_NAMES = [
	"Ana",
	"Antônio",
	"Beatriz",
	"Carlos",
	"Cláudia",
	"Daniel",
	"Débora",
	"Eduardo",
	"Fernanda",
	"Francisco",
	"Gabriel",
	"Helena",
	"Igor",
	"Joana",
	"João",
	"Larissa",
	"Lucas",
	"Luiza",
	"Marcos",
	"Maria",
	"Mariana",
	"Matheus",
	"Nathália",
	"Otávio",
	"Patrícia",
	"Paulo",
	"Rafael",
	"Raimunda",
	"Renata",
	"Ricardo",
	"Sabrina",
	"Sérgio",
	"Tatiana",
	"Thiago",
	"Vanessa",
	"Vitor",
];

const LAST_NAMES = [
	"Almeida",
	"Alves",
	"Barbosa",
	"Barros",
	"Carvalho",
	"Costa",
	"Dias",
	"Fernandes",
	"Ferreira",
	"Gomes",
	"Lima",
	"Lopes",
	"Martins",
	"Melo",
	"Mendes",
	"Moraes",
	"Nascimento",
	"Nunes",
	"Oliveira",
	"Pereira",
	"Ramos",
	"Ribeiro",
	"Rocha",
	"Rodrigues",
	"Santos",
	"Silva",
	"Sousa",
	"Teixeira",
];

function readArg(name) {
	const prefix = `--${name}=`;
	const match = process.argv.find((arg) => arg.startsWith(prefix));

	return match === undefined ? undefined : match.slice(prefix.length);
}

function hasFlag(name) {
	return process.argv.includes(`--${name}`);
}

function readNumberArg(name, fallback) {
	const raw = readArg(name);

	if (raw === undefined) {
		return fallback;
	}

	const value = Number.parseInt(raw, 10);

	if (Number.isNaN(value) || value <= 0) {
		console.error(`--${name} precisa ser um número inteiro positivo.`);
		process.exit(1);
	}

	return value;
}

/**
 * PRNG determinístico (mulberry32).
 *
 * `Math.random` bastaria, mas com semente dá para reproduzir exatamente a mesma
 * massa ao investigar um caso estranho na tela — a semente usada aparece na
 * mensagem final.
 */
function createRandom(seed) {
	let state = seed >>> 0;

	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function pick(random, items) {
	return items[Math.floor(random() * items.length)];
}

function randomInt(random, min, max) {
	return min + Math.floor(random() * (max - min + 1));
}

/**
 * Telefone celular válido para o domínio: DDD real e 9 dígitos começando com 9,
 * o que `PhoneNumber` exige ao reconstituir o registro na leitura.
 *
 * O `value` é a chave de deduplicação `(campaignId, phone)`, então quem chama
 * precisa garantir que não repete.
 */
function createPhone(random) {
	const areaCode = pick(random, AREA_CODES);
	const subscriber = `9${String(randomInt(random, 0, 99_999_999)).padStart(8, "0")}`;

	return {
		value: `55${areaCode}${subscriber}`,
		display: `(${areaCode}) ${subscriber.slice(0, 5)}-${subscriber.slice(5)}`,
	};
}

/**
 * Quantas vezes a pessoa se cadastrou: a maioria uma vez só, com uma cauda de
 * recadastros — é ela que exercita a coluna "Cadastros" do painel.
 */
function drawParticipationCount(random) {
	const roll = random();

	if (roll < 0.7) {
		return 1;
	}

	if (roll < 0.9) {
		return 2;
	}

	return randomInt(random, 3, 5);
}

/**
 * Cupom fictício como data URL, no mesmo formato que o navegador envia.
 *
 * É um SVG e não um JPEG porque o que importa é a miniatura abrir no painel; o
 * texto "CUPOM FICTÍCIO" evita confundir massa de teste com cupom de verdade.
 */
/**
 * CPF/CNPJ fictício, mas com dígitos verificadores corretos.
 *
 * Precisa fechar a conta: o `TaxDocument` valida os dígitos, e um documento
 * inválido no banco faria o `restore` lançar ao abrir o painel.
 */
function createDocument(random, isCompany) {
	if (isCompany) {
		const base = Array.from({ length: 12 }, (_, index) =>
			index >= 8 ? (index === 11 ? 1 : 0) : randomInt(random, 0, 9),
		);
		const digits = [...base, checkDigit(base, 5), 0];
		digits[13] = checkDigit(digits.slice(0, 13), 6);

		const value = digits.join("");

		return {
			value,
			display: `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12)}`,
		};
	}

	const base = Array.from({ length: 9 }, () => randomInt(random, 0, 9));
	const first = cpfCheckDigit(base, 10);
	const second = cpfCheckDigit([...base, first], 11);
	const value = [...base, first, second].join("");

	return {
		value,
		display: `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`,
	};
}

/** Módulo 11 do CPF: pesos decrescentes a partir de `start`. */
function cpfCheckDigit(digits, start) {
	const sum = digits.reduce(
		(total, digit, index) => total + digit * (start - index),
		0,
	);
	const remainder = (sum * 10) % 11;

	return remainder === 10 ? 0 : remainder;
}

/** Módulo 11 do CNPJ: pesos de `start` até 2, voltando a 9 quando esgotam. */
function checkDigit(digits, start) {
	let weight = start;
	let sum = 0;

	for (const digit of digits) {
		sum += digit * weight;
		weight = weight === 2 ? 9 : weight - 1;
	}

	const remainder = sum % 11;

	return remainder < 2 ? 0 : 11 - remainder;
}

function createReceipt(storeName, total) {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="440" viewBox="0 0 320 440"><rect width="320" height="440" fill="#f4f1ea"/><text x="160" y="70" font-family="monospace" font-size="20" text-anchor="middle" fill="#1b1b1b">PLASTLIMA</text><text x="160" y="100" font-family="monospace" font-size="13" text-anchor="middle" fill="#555555">${storeName}</text><text x="160" y="220" font-family="monospace" font-size="26" text-anchor="middle" fill="#1b1b1b">R$ ${total}</text><text x="160" y="380" font-family="monospace" font-size="15" text-anchor="middle" fill="#b00020">CUPOM FICTICIO</text></svg>`;

	return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

/**
 * Host do banco, sem credencial. Anunciar o destino antes de gravar é a mesma
 * precaução do seed de usuário: massa fictícia no banco de produção estragaria
 * a apuração do sorteio.
 */
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

const campaignId = readArg("campanha") ?? DEFAULT_CAMPAIGN_ID;
const count = readNumberArg("quantidade", DEFAULT_COUNT);
const spreadDays = readNumberArg("dias", DEFAULT_SPREAD_DAYS);
const seed = readNumberArg("semente", (Date.now() % 2_147_483_647) + 1);
const shouldClear = hasFlag("limpar");

const host = describeTarget(process.env.DATABASE_URL);

if (host === null) {
	console.error("DATABASE_URL ausente ou em formato inválido.");
	process.exit(1);
}

const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");

if (!isLocal && !hasFlag("forcar")) {
	console.error(
		`Recusando gravar participantes fictícios em ${host}: não parece um banco local.\n` +
			"Se for mesmo isso que você quer, repita o comando com --forcar.",
	);
	process.exit(1);
}

console.info(`Gravando em: ${host} (campanha ${campaignId})`);

const random = createRandom(seed);
const prisma = new PrismaClient();

try {
	if (shouldClear) {
		const removed = await prisma.participant.deleteMany({
			where: { campaignId },
		});

		console.info(`Removidos ${removed.count} participantes anteriores.`);
	}

	// Os telefones já gravados entram no conjunto de usados: o índice único
	// `(campaignId, phone)` derrubaria a inserção no primeiro choque.
	const existing = await prisma.participant.findMany({
		where: { campaignId },
		select: { phone: true },
	});

	const usedPhones = new Set(existing.map((participant) => participant.phone));
	const now = Date.now();
	const rows = [];

	while (rows.length < count) {
		const phone = createPhone(random);

		if (usedPhones.has(phone.value)) {
			continue;
		}

		usedPhones.add(phone.value);

		const store =
			random() < DISTRIBUTION_CENTER_RATE
				? DISTRIBUTION_CENTER
				: pick(random, STORES);
		const name = `${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)} ${pick(random, LAST_NAMES)}`;
		const createdAt = new Date(
			now - Math.floor(random() * spreadDays * DAY_IN_MS),
		);
		const participationCount = drawParticipationCount(random);

		// O recadastro é sempre depois do primeiro cadastro e nunca no futuro.
		const lastParticipatedAt =
			participationCount === 1
				? createdAt
				: new Date(
						createdAt.getTime() +
							Math.floor(random() * (now - createdAt.getTime())),
					);

		const cents = String(randomInt(random, 0, 99)).padStart(2, "0");

		// Cliente do CD é atacado: quando informa documento, costuma ser CNPJ.
		const document =
			random() < DOCUMENT_RATE
				? createDocument(random, store.pool === "cd")
				: null;

		rows.push({
			campaignId,
			name,
			phone: phone.value,
			phoneDisplay: phone.display,
			storeId: store.id,
			storeName: store.name,
			city: store.city,
			state: store.state,
			pool: store.pool ?? "unidades",
			document: document?.value ?? null,
			documentDisplay: document?.display ?? null,
			receiptImage:
				random() < RECEIPT_RATE
					? createReceipt(store.name, `${randomInt(random, 12, 480)},${cents}`)
					: null,
			participationCount,
			acceptedTermsAt: createdAt,
			createdAt,
			lastParticipatedAt,
		});
	}

	const created = await prisma.participant.createMany({ data: rows });
	const total = await prisma.participant.count({ where: { campaignId } });

	console.info(
		`Criados ${created.count} participantes (semente ${seed}). Total na campanha: ${total}.`,
	);
} finally {
	await prisma.$disconnect();
}
