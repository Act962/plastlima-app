import type { LegalDocument } from "@/types/legal";
import { RAFFLE_CAMPAIGN } from "./raffle";
import { SITE } from "./site";

/**
 * Regulamento da campanha.
 *
 * ⚠️ RASCUNHO — NÃO PUBLICAR SEM REVISÃO JURÍDICA.
 *
 * Sorteio condicionado a compra é "distribuição gratuita de prêmios a título de
 * propaganda" (Lei 5.768/71 e Decreto 70.951/72) e depende de autorização prévia
 * da Secretaria de Prêmios e Apostas do Ministério da Fazenda. A estrutura
 * abaixo já contempla os itens exigidos; os trechos marcados com `[A DEFINIR]`
 * só podem ser preenchidos pelo cliente ou pelo jurídico.
 */
export const RAFFLE_RULES: LegalDocument = {
	updatedAt: "rascunho — pendente de aprovação jurídica",

	intro: [
		`Este regulamento estabelece as condições de participação na promoção "${RAFFLE_CAMPAIGN.prize} — Mês dos Pais", realizada pela ${SITE.name}.`,
		"Ao se cadastrar, o participante declara ter lido e aceito integralmente as regras descritas abaixo.",
	],

	sections: [
		{
			id: "autorizacao",
			title: "1. Autorização",
			blocks: [
				{
					type: "paragraph",
					text: "Promoção autorizada pela Secretaria de Prêmios e Apostas do Ministério da Fazenda, conforme Certificado de Autorização nº [A DEFINIR].",
				},
			],
		},
		{
			id: "periodo",
			title: "2. Período de participação",
			blocks: [
				{
					type: "paragraph",
					text: `Os cadastros são aceitos de [A DEFINIR — data de início] até ${RAFFLE_CAMPAIGN.entriesCloseAt.toLocaleDateString("pt-BR")}, às 23h59 (horário de Brasília). Cadastros enviados fora desse período não são considerados.`,
				},
			],
		},
		{
			id: "quem-pode",
			title: "3. Quem pode participar",
			blocks: [
				{
					type: "list",
					lead: "Podem participar pessoas físicas que, cumulativamente:",
					items: [
						"tenham 18 anos completos ou mais;",
						"sejam residentes e domiciliadas no território nacional;",
						"tenham realizado compra de qualquer valor em uma das lojas participantes durante o período da promoção;",
						"tenham concluído o cadastro na página oficial da campanha.",
					],
				},
				{
					type: "paragraph",
					text: "[A DEFINIR] Sócios, funcionários e familiares diretos da promotora podem participar?",
				},
			],
		},
		{
			id: "como-participar",
			title: "4. Como participar",
			blocks: [
				{
					type: "list",
					lead: "A participação é gratuita após a compra e se dá em quatro etapas:",
					items: [
						"realizar uma compra de qualquer valor em uma loja participante;",
						"acessar a página oficial da campanha no site da Plastlima;",
						"preencher o cadastro com nome, WhatsApp e a loja onde comprou;",
						"opcionalmente, anexar a foto do cupom fiscal.",
					],
				},
				{
					type: "paragraph",
					text: "Cada pessoa concorre uma única vez, identificada pelo número de WhatsApp informado. Cadastros repetidos com o mesmo número não geram novas chances.",
				},
			],
		},
		{
			id: "premio",
			title: "5. Prêmio",
			blocks: [
				{
					type: "paragraph",
					text: `Será distribuído 1 (um) ${RAFFLE_CAMPAIGN.prize}, composto por [A DEFINIR — descrição detalhada dos itens], no valor total de R$ [A DEFINIR].`,
				},
				{
					type: "paragraph",
					text: "O prêmio é pessoal e intransferível, não podendo ser trocado por dinheiro ou por outro produto.",
				},
			],
		},
		{
			id: "sorteio",
			title: "6. Sorteio e apuração",
			blocks: [
				{
					type: "paragraph",
					text: `O sorteio será realizado em ${RAFFLE_CAMPAIGN.drawDateLabel}, por meio de [A DEFINIR — critério de apuração, por exemplo vinculação à Loteria Federal], com transmissão em [A DEFINIR].`,
				},
			],
		},
		{
			id: "entrega",
			title: "7. Divulgação e entrega",
			blocks: [
				{
					type: "paragraph",
					text: "O ganhador será contatado pelo WhatsApp informado no cadastro em até [A DEFINIR] dias úteis após o sorteio, e o resultado será divulgado nas redes sociais da Plastlima.",
				},
				{
					type: "paragraph",
					text: "A entrega do prêmio ocorrerá em [A DEFINIR — local e prazo], mediante apresentação de documento de identificação com foto e do cupom fiscal da compra.",
				},
			],
		},
		{
			id: "dados",
			title: "8. Tratamento de dados pessoais",
			blocks: [
				{
					type: "paragraph",
					text: `Os dados informados no cadastro são tratados pela ${SITE.name} exclusivamente para administrar esta promoção, apurar o resultado e contatar o ganhador, em conformidade com a Lei nº 13.709/2018 (LGPD).`,
				},
				{
					type: "paragraph",
					text: "O participante pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelo e-mail informado na Política de Privacidade. Os registros são eliminados em até [A DEFINIR] após o encerramento da promoção.",
				},
			],
		},
		{
			id: "disposicoes",
			title: "9. Disposições gerais",
			blocks: [
				{
					type: "paragraph",
					text: "A participação nesta promoção implica a aceitação total das condições deste regulamento. Casos omissos serão resolvidos pela promotora, observada a legislação aplicável.",
				},
			],
		},
	],
};
