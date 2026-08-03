import type { LegalDocument } from "@/types/legal";
import { CONTACT, SITE } from "./site";

/**
 * Política de Privacidade da Plastlima, redigida em conformidade com a
 * LGPD (Lei nº 13.709/2018). Conteúdo mantido como dado para separar a
 * cópia da apresentação e facilitar futuras revisões jurídicas.
 */
export const PRIVACY_POLICY: LegalDocument = {
	updatedAt: "31 de julho de 2026",
	intro: [
		`A ${SITE.name} valoriza a privacidade e a proteção dos dados pessoais de seus clientes, parceiros e visitantes. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos as informações obtidas por meio deste site, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).`,
		"Ao navegar e utilizar nossos canais, você declara estar ciente das práticas descritas neste documento. Recomendamos a leitura atenta de todas as seções.",
	],
	sections: [
		{
			id: "controlador",
			title: "1. Quem é o controlador dos dados",
			blocks: [
				{
					type: "paragraph",
					text: `O controlador responsável pelo tratamento dos seus dados pessoais é a ${SITE.name}, com sede em ${SITE.address}. Para qualquer assunto relacionado a esta política, entre em contato pelo e-mail ${SITE.email}.`,
				},
			],
		},
		{
			id: "dados-coletados",
			title: "2. Quais dados coletamos",
			blocks: [
				{
					type: "list",
					lead: "Coletamos apenas os dados necessários para atender às suas solicitações, que podem incluir:",
					items: [
						"Dados de identificação e contato, como nome, e-mail e telefone, fornecidos voluntariamente em formulários de contato ou de interesse em franquia;",
						"Conteúdo das mensagens que você nos envia por formulário, e-mail ou WhatsApp;",
						"Dados de navegação, como endereço IP, tipo de dispositivo, navegador e páginas acessadas, coletados automaticamente por meio de cookies e tecnologias semelhantes.",
					],
				},
			],
		},
		{
			id: "finalidades",
			title: "3. Para que utilizamos seus dados",
			blocks: [
				{
					type: "list",
					lead: "Os dados coletados são tratados para as seguintes finalidades:",
					items: [
						"Responder a solicitações de contato, orçamento e informações sobre franquias;",
						"Estabelecer e manter relacionamento comercial com clientes e parceiros;",
						"Melhorar a experiência de navegação e o desempenho do site;",
						"Cumprir obrigações legais e regulatórias aplicáveis à nossa atividade.",
					],
				},
			],
		},
		{
			id: "base-legal",
			title: "4. Bases legais para o tratamento",
			blocks: [
				{
					type: "paragraph",
					text: "O tratamento dos seus dados fundamenta-se nas hipóteses legais previstas na LGPD, especialmente o consentimento do titular, a execução de contrato ou de procedimentos preliminares a seu pedido, o cumprimento de obrigação legal e o legítimo interesse, sempre respeitados os seus direitos e liberdades fundamentais.",
				},
			],
		},
		{
			id: "compartilhamento",
			title: "5. Compartilhamento de dados",
			blocks: [
				{
					type: "paragraph",
					text: `A ${SITE.name} não comercializa dados pessoais. O compartilhamento ocorre apenas quando necessário para a prestação dos nossos serviços — por exemplo, com prestadores de serviços de tecnologia, hospedagem e comunicação — ou para o cumprimento de obrigação legal e atendimento a autoridades competentes. Nesses casos, exigimos que os terceiros adotem medidas de segurança compatíveis com esta política.`,
				},
			],
		},
		{
			id: "cookies",
			title: "6. Cookies e tecnologias de navegação",
			blocks: [
				{
					type: "paragraph",
					text: "Utilizamos cookies para lembrar preferências, medir o desempenho do site e melhorar sua experiência. Você pode gerenciar ou desativar os cookies nas configurações do seu navegador; contudo, algumas funcionalidades podem ser afetadas caso eles sejam bloqueados.",
				},
			],
		},
		{
			id: "direitos",
			title: "7. Seus direitos como titular",
			blocks: [
				{
					type: "list",
					lead: "Nos termos da LGPD, você pode, a qualquer momento, solicitar:",
					items: [
						"A confirmação da existência de tratamento e o acesso aos seus dados;",
						"A correção de dados incompletos, inexatos ou desatualizados;",
						"A anonimização, o bloqueio ou a eliminação de dados desnecessários ou tratados em desconformidade com a lei;",
						"A portabilidade dos dados a outro fornecedor de serviço;",
						"A eliminação dos dados tratados com base no seu consentimento;",
						"A revogação do consentimento, quando esta for a base legal utilizada.",
					],
				},
				{
					type: "paragraph",
					text: `Para exercer qualquer um desses direitos, entre em contato pelo e-mail ${SITE.email} ou pelo WhatsApp ${CONTACT.support.display}.`,
				},
			],
		},
		{
			id: "seguranca",
			title: "8. Segurança e armazenamento",
			blocks: [
				{
					type: "paragraph",
					text: "Adotamos medidas técnicas e administrativas razoáveis para proteger os dados pessoais contra acessos não autorizados, perda, alteração ou divulgação indevida. Os dados são mantidos apenas pelo tempo necessário para cumprir as finalidades descritas nesta política ou para atender a obrigações legais.",
				},
			],
		},
		{
			id: "alteracoes",
			title: "9. Alterações desta política",
			blocks: [
				{
					type: "paragraph",
					text: "Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em nossas práticas ou na legislação aplicável. A versão vigente estará sempre disponível nesta página, com a data da última revisão indicada no início do documento.",
				},
			],
		},
		{
			id: "contato",
			title: "10. Fale conosco",
			blocks: [
				{
					type: "paragraph",
					text: `Em caso de dúvidas sobre esta política ou sobre o tratamento dos seus dados, entre em contato pelo e-mail ${SITE.email} ou pelo telefone ${CONTACT.support.display}.`,
				},
			],
		},
	],
};
