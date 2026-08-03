import type { LegalDocument } from "@/types/legal";
import { RAFFLE_CAMPAIGN } from "./raffle";
import { SITE } from "./site";

/**
 * Regulamento da campanha, transcrito do documento oficial enviado pelo
 * cliente ("REGULAMENTO DA CAMPANHA: GANHE UM KIT CHURRASCO PLASTLIMA").
 *
 * As seções seguem a ordem do documento oficial. Duas seções vêm do rascunho
 * anterior e não têm equivalente no documento do cliente: "Tratamento de dados
 * pessoais" (detalha os direitos do titular exigidos pela LGPD) e a redação de
 * "Quem pode participar" em forma de lista.
 *
 * ⚠️ O documento oficial não menciona Certificado de Autorização. Sorteio
 * condicionado a compra é "distribuição gratuita de prêmios a título de
 * propaganda" (Lei 5.768/71 e Decreto 70.951/72) e depende de autorização
 * prévia da Secretaria de Prêmios e Apostas do Ministério da Fazenda.
 */
export const RAFFLE_RULES: LegalDocument = {
	updatedAt: "31 de julho de 2026",

	intro: [
		`Este regulamento estabelece as condições de participação na campanha "Ganhe um ${RAFFLE_CAMPAIGN.prize} Plastlima", realizada pela ${SITE.name}.`,
		"Ao se cadastrar, o participante declara ter lido e aceito integralmente as regras descritas abaixo.",
	],

	sections: [
		{
			id: "campanha",
			title: "1. Da campanha",
			blocks: [
				{
					type: "paragraph",
					text: `A campanha "Ganhe um ${RAFFLE_CAMPAIGN.prize} Plastlima" é uma ação promocional realizada pela ${SITE.name} com o objetivo de presentear seus clientes durante a Semana dos Pais.`,
				},
			],
		},
		{
			id: "periodo",
			title: "2. Período da campanha",
			blocks: [
				{
					type: "paragraph",
					text: "A campanha é válida de 1º de agosto de 2026 até 30 de agosto de 2026, conforme divulgado nos materiais oficiais.",
				},
				{
					type: "paragraph",
					text: `O sorteio será realizado no dia ${RAFFLE_CAMPAIGN.drawDateLabel}.`,
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
						"sejam residentes no Brasil;",
						"tenham realizado compra em qualquer unidade Plastlima durante o período da campanha;",
						"tenham concluído o cadastro na página oficial da campanha.",
						"ESTÁ VEDADA A PARTICIPAÇÃO DE COLABORADORES DO GRUPO PLASTLIMA.",
					],
				},
			],
		},
		{
			id: "como-participar",
			title: "4. Como participar",
			blocks: [
				{
					type: "list",
					lead: "Para participar é necessário:",
					items: [
						"realizar uma compra em qualquer uma das franquias Plastlima durante o período da campanha;",
						`acessar o site oficial da campanha — ${new URL(SITE.url).host};`,
						"preencher corretamente o formulário com nome completo, WhatsApp e a loja onde realizou a compra.",
					],
				},
				{
					type: "paragraph",
					text: "O participante pode também anexar a foto do cupom de compra. Após o envio do formulário, a participação está automaticamente registrada.",
				},
			],
		},
		{
			id: "participacao",
			title: "5. Da participação",
			blocks: [
				{
					type: "paragraph",
					text: "Quanto mais você comprar, mais chance tem de ganhar.",
				},
				{
					type: "paragraph",
					text: "O cadastro deve ser realizado dentro do período de vigência da promoção. Cadastros incompletos ou com informações incorretas podem ser desclassificados.",
				},
			],
		},
		{
			id: "premio",
			title: "6. Do prêmio",
			blocks: [
				{
					type: "paragraph",
					text: `Será sorteado 01 (um) ${RAFFLE_CAMPAIGN.prize} Plastlima, composto pelos itens divulgados na campanha.`,
				},
				{
					type: "paragraph",
					text: `A ${SITE.name} pode substituir algum item do kit por outro de igual ou superior valor, caso haja indisponibilidade.`,
				},
			],
		},
		{
			id: "sorteio",
			title: "7. Do sorteio",
			blocks: [
				{
					type: "paragraph",
					text: `O sorteio ocorrerá em ${RAFFLE_CAMPAIGN.drawDateLabel}, em horário e formato definidos pela ${SITE.name}.`,
				},
				{
					type: "list",
					lead: "O resultado será divulgado:",
					items: [
						"no site oficial;",
						`nas redes sociais da ${SITE.name}, podendo também ser divulgado nas lojas participantes.`,
					],
				},
			],
		},
		{
			id: "entrega",
			title: "8. Entrega do prêmio",
			blocks: [
				{
					type: "paragraph",
					text: "O ganhador será contatado através do telefone ou WhatsApp informado no cadastro.",
				},
				{
					type: "paragraph",
					text: `Caso não seja localizado em até 7 (sete) dias corridos, a ${SITE.name} pode realizar novo sorteio, conforme critérios estabelecidos pela organização da campanha.`,
				},
				{
					type: "paragraph",
					text: "O prêmio é pessoal e intransferível, não podendo ser convertido em dinheiro.",
				},
			],
		},
		{
			id: "desclassificacao",
			title: "9. Desclassificação",
			blocks: [
				{
					type: "list",
					lead: "São desclassificados os participantes que:",
					items: [
						"preencherem informações falsas;",
						"realizarem cadastros duplicados utilizando dados de terceiros;",
						"não atenderem aos critérios deste regulamento.",
					],
				},
			],
		},
		{
			id: "dados",
			title: "10. Tratamento de dados pessoais",
			blocks: [
				{
					type: "paragraph",
					text: `Os dados informados no cadastro são tratados pela ${SITE.name} para administrar esta campanha, apurar o resultado e contatar o ganhador, em conformidade com a Lei nº 13.709/2018 (LGPD).`,
				},
				{
					type: "paragraph",
					text: `Os dados também podem ser utilizados pela ${SITE.name} para comunicações institucionais e promocionais, conforme a legislação aplicável e a Política de Privacidade da empresa.`,
				},
				{
					type: "paragraph",
					text: "O participante pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelo e-mail informado na Política de Privacidade.",
				},
			],
		},
		{
			id: "disposicoes",
			title: "11. Disposições gerais",
			blocks: [
				{
					type: "paragraph",
					text: "Ao participar da campanha, o cliente declara estar de acordo com este regulamento.",
				},
				{
					type: "paragraph",
					text: "Os casos omissos são analisados pela organização da campanha.",
				},
			],
		},
		{
			id: "duvidas",
			title: "12. Dúvidas",
			blocks: [
				{
					type: "paragraph",
					text: `Em caso de dúvidas, o participante pode entrar em contato pelos canais oficiais da ${SITE.name} ou procurar atendimento em qualquer uma das lojas participantes.`,
				},
			],
		},
	],
};
