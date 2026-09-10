import type { LegalDocument } from "@/types/legal";
import { RAFFLE_CAMPAIGN } from "./raffle";
import { SITE } from "./site";

/**
 * Regulamento da campanha "Compre e Concorra — Plastlima e Vinco".
 *
 * Transcrição do regulamento oficial entregue pelo cliente (PDF "REGULAMENTO
 * PLASTLIMA+VINCO"), que é o documento com valor jurídico. Ao atualizar, siga
 * o PDF: cláusula que não está lá não deve aparecer aqui, porque o site não
 * pode impor ao participante uma regra que o cliente não aprovou.
 *
 * Dois pontos vão além do PDF, ambos porque descrevem o que o formulário
 * realmente faz:
 * 1. §5 exige a foto do cupom. O PDF lista o cupom entre as informações do
 *    cadastro, mas não o descreve como obrigatório — o cliente confirmou que é.
 * 2. §5 explica que o grupo é fixado no primeiro cadastro. É o índice único
 *    `(campaignId, phone)` do banco, e sem essa frase a pessoa que se recadastra
 *    por outro canal não entende por que continua no grupo anterior.
 *
 * O período de §2 é o mesmo `RAFFLE_CAMPAIGN.entriesCloseAt` (14/10/2026), que
 * é o que fecha o formulário de fato. Os dois andam juntos: se um mudar sem o
 * outro, o site passa a aceitar cadastro fora do prazo que promete aqui.
 *
 * ⚠️ PENDENTE:
 * - Certificado de Autorização: sorteio condicionado a compra é "distribuição
 *   gratuita de prêmios a título de propaganda" (Lei 5.768/71 e Decreto
 *   70.951/72) e depende de autorização prévia da Secretaria de Prêmios e
 *   Apostas do Ministério da Fazenda. O regulamento oficial não menciona
 *   certificado.
 */
export const RAFFLE_RULES: LegalDocument = {
	updatedAt: "10 de setembro de 2026",

	intro: [
		'Regulamento completo da campanha promocional "Compre e Concorra — Plastlima e Vinco".',
		`Campanha válida de 9 de setembro a 14 de outubro de 2026, com sorteio em ${RAFFLE_CAMPAIGN.drawDateLabel}.`,
	],

	sections: [
		{
			id: "campanha",
			title: "1. Da campanha",
			blocks: [
				{
					type: "paragraph",
					text: `A campanha promocional "Compre e Concorra — Plastlima e Vinco", denominada neste documento como CAMPANHA, é realizada pela ${SITE.name} em parceria com a marca Vinco.`,
				},
				{
					type: "paragraph",
					text: "A participação implica na aceitação integral das regras estabelecidas neste regulamento.",
				},
			],
		},
		{
			id: "periodo",
			title: "2. Do período da campanha",
			blocks: [
				{
					type: "paragraph",
					text: "A campanha será realizada no período de 9 de setembro de 2026 a 14 de outubro de 2026.",
				},
				{
					type: "paragraph",
					text: `O sorteio está previsto para o dia ${RAFFLE_CAMPAIGN.drawDateLabel}.`,
				},
			],
		},
		{
			id: "locais",
			title: "3. Dos locais participantes",
			blocks: [
				{
					type: "list",
					lead: "A campanha será válida em:",
					items: [
						`todas as franquias ${SITE.name};`,
						`Centro de Distribuição ${SITE.name}.`,
					],
				},
			],
		},
		{
			id: "mecanica",
			title: "4. Da mecânica de participação",
			blocks: [
				{
					type: "paragraph",
					text: `4.1. Nas franquias — para participar através das franquias ${SITE.name}, o cliente deverá adquirir qualquer produto da marca Vinco durante o período da campanha. Após a compra, deverá realizar o cadastro no site oficial da campanha.`,
				},
				{
					type: "paragraph",
					text: "4.2. No Centro de Distribuição — para participar, é necessário realizar compras a partir de R$ 200,00 (duzentos reais). A cada compra que atingir esse valor mínimo, o cliente estará apto a participar da promoção, conforme as regras estabelecidas neste regulamento. Após cumprir a condição de compra, deverá realizar o cadastro no site oficial da campanha.",
				},
			],
		},
		{
			id: "cadastro",
			title: "5. Do cadastro",
			blocks: [
				{
					type: "paragraph",
					text: `O participante deverá acessar o site oficial da campanha — ${new URL(SITE.url).host} — e preencher corretamente as informações solicitadas.`,
				},
				{
					type: "list",
					lead: "Entre as informações que poderão ser solicitadas estão:",
					items: [
						"nome;",
						"número de WhatsApp;",
						"local onde realizou a compra;",
						"foto do cupom da compra;",
						"CPF ou CNPJ, quando necessário.",
					],
				},
				{
					type: "paragraph",
					text: "O envio da foto do cupom é obrigatório: é o comprovante da compra que dá direito à participação. Cadastros sem cupom não são registrados.",
				},
				{
					type: "paragraph",
					text: "Cada participante concorre em um único grupo, definido pelo local de compra informado no primeiro cadastro. Novos cadastros com o mesmo número de WhatsApp somam participações no mesmo grupo e não transferem o participante para o outro sorteio.",
				},
				{
					type: "paragraph",
					text: "O participante é responsável pela veracidade das informações fornecidas.",
				},
			],
		},
		{
			id: "premio",
			title: "6. Do prêmio",
			blocks: [
				{
					type: "paragraph",
					text: "Será disponibilizado como prêmio 01 (uma) TV de 42 polegadas para as franquias e 01 (uma) para o Centro de Distribuição.",
				},
			],
		},
		{
			id: "apuracao",
			title: "7. Da apuração",
			blocks: [
				{
					type: "paragraph",
					text: `A definição dos participantes contemplados ocorrerá no dia ${RAFFLE_CAMPAIGN.drawDateLabel}.`,
				},
				{
					type: "paragraph",
					text: "A apuração seguirá a mecânica definida oficialmente pela organização da campanha.",
				},
			],
		},
		{
			id: "validacao",
			title: "8. Da validação",
			blocks: [
				{
					type: "list",
					lead: "Antes da entrega do prêmio, a organização poderá solicitar informações e documentos para confirmar:",
					items: [
						"a identidade do participante;",
						"os dados cadastrados;",
						"o cumprimento das regras da campanha;",
						"a realização da compra dentro das condições exigidas.",
					],
				},
			],
		},
		{
			id: "desclassificacao",
			title: "9. Da desclassificação",
			blocks: [
				{
					type: "list",
					lead: "Poderá ser desclassificado o participante que:",
					items: [
						"fornecer informações falsas;",
						"não cumprir as condições de participação;",
						"tentar utilizar meios fraudulentos;",
						"não atender às solicitações necessárias para validação da participação.",
					],
				},
			],
		},
		{
			id: "divulgacao",
			title: "10. Da divulgação",
			blocks: [
				{
					type: "paragraph",
					text: `O resultado será divulgado através dos canais oficiais da ${SITE.name} e da Vinco.`,
				},
				{
					type: "paragraph",
					text: "O participante contemplado poderá ser comunicado por meio do WhatsApp cadastrado.",
				},
			],
		},
		{
			id: "elegibilidade",
			title: "11. Da elegibilidade e impedimentos",
			blocks: [
				{
					type: "paragraph",
					text: `Não poderão participar desta campanha colaboradores da ${SITE.name}, das franquias participantes, do Centro de Distribuição, da Vinco, bem como seus familiares, independentemente do vínculo ou da unidade em que atuem.`,
				},
				{
					type: "paragraph",
					text: "Caso seja identificado que o participante possui vínculo como colaborador ou seja familiar de colaborador, sua participação será automaticamente invalidada e, caso tenha sido contemplado, será desclassificado.",
				},
			],
		},
		{
			id: "dados",
			title: "12. Proteção de dados",
			blocks: [
				{
					type: "paragraph",
					text: "Os dados fornecidos pelos participantes serão utilizados para fins relacionados à operacionalização e validação da campanha, observando-se a legislação aplicável.",
				},
				{
					type: "paragraph",
					text: `O tratamento observa a Lei nº 13.709/2018 (LGPD). O participante pode solicitar acesso, correção ou exclusão dos seus dados pelo e-mail informado na Política de Privacidade da ${SITE.name}.`,
				},
			],
		},
		{
			id: "disposicoes",
			title: "13. Disposições gerais",
			blocks: [
				{
					type: "paragraph",
					text: "A participação na campanha implica na concordância com todas as regras deste regulamento.",
				},
				{
					type: "paragraph",
					text: "Situações não previstas serão analisadas pela organização da campanha, respeitando as normas aplicáveis.",
				},
			],
		},
	],
};
