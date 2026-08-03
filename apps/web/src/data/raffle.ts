import type { RaffleCampaignContent } from "@/types/raffle";

/**
 * Campanha "Sorteio Kit Churrasco — Mês dos Pais".
 *
 * A data de encerramento é a única configuração com efeito funcional: depois
 * dela a página deixa de exibir o formulário e a Server Action recusa envios.
 *
 * PENDENTE: confirmar com o cliente o encerramento exato das inscrições. O
 * banner da home anuncia o sorteio em 31 de agosto, o que não é necessariamente
 * o fim do prazo de cadastro. O valor abaixo assume o dia anterior.
 */
export const RAFFLE_CAMPAIGN: RaffleCampaignContent = {
	id: "kit-churrasco-2026",
	prize: "Kit Churrasco",
	drawDateLabel: "31 de agosto de 2026",
	entriesCloseAt: new Date("2026-08-30T23:59:59-03:00"),

	hero: {
		eyebrow: "Promoção mês dos pais",
		title: "Compre na Plastlima e concorra a um Kit Churrasco",
		lead: "Qualquer valor de compra já garante sua participação. Faça o cadastro, confirme seus dados e é só torcer.",
		ctaLabel: "Quero participar",
		image: {
			src: "/banners/sorteio-dia-dos-pais.png",
			alt: "Arte da promoção de mês dos pais da Plastlima, com o Kit Churrasco sorteado em 31 de agosto",
			width: 2400,
			height: 1250,
		},
	},

	steps: [
		{
			id: "compre",
			title: "Faça uma compra",
			description:
				"Qualquer valor já garante sua participação — e cada nova compra vale mais uma chance.",
		},
		{
			id: "acesse",
			title: "Acesse o site",
			description: "Entre na página oficial da campanha.",
		},
		{
			id: "cadastre",
			title: "Faça seu cadastro",
			description:
				"Informe seu nome, WhatsApp e a loja onde você comprou. Se quiser, anexe a foto do cupom.",
		},
		{
			id: "confirme",
			title: "Participação confirmada",
			description:
				"Após validar o cadastro, você já estará concorrendo ao Kit Churrasco.",
		},
	],

	form: {
		title: "Faça seu cadastro e concorra",
		description:
			"Leva menos de um minuto. Usamos o WhatsApp apenas para avisar o ganhador. Comprou de novo? Cadastre outra vez com o mesmo número: cada compra vale mais uma chance.",
	},

	confirmation: {
		title: "Parabéns!",
		message: "Sua participação foi registrada com sucesso. Agora é só torcer!",
		repeatMessage:
			"Esta é a sua {count}ª participação. Quanto mais você compra e se cadastra, mais chances tem de ganhar!",
		repeatHint:
			"Comprou de novo? Volte aqui e preencha o formulário com o mesmo WhatsApp — cada compra vale mais uma chance.",
		invitation:
			"Enquanto isso, aproveite para conhecer nossa linha completa de produtos para churrasco, festas e eventos.",
		ctaLabel: "Conheça nossos produtos",
	},

	closed: {
		title: "Inscrições encerradas",
		message:
			"O prazo de cadastro para o sorteio do Kit Churrasco terminou. Fique de olho nas nossas redes: o resultado sai em breve e novas promoções estão a caminho.",
	},

	popup: {
		eyebrow: "Promoção mês dos pais",
		title: "Ganhe um Kit Churrasco!",
		message:
			"Compre em qualquer loja Plastlima e cadastre-se para concorrer. Sorteio em 31 de agosto.",
		ctaLabel: "Quero participar",
		dismissLabel: "Agora não",
		image: {
			src: "/banners/sorteio-popup.jpeg",
			alt: "Sorteio mês dos pais: compre na Plastlima e concorra a um Kit Churrasco com caixa térmica, grelha, garrafa térmica, tábua e facas. Sorteio em 31 de agosto.",
			width: 1080,
			height: 1350,
		},
	},

	seo: {
		title: "Sorteio Kit Churrasco",
		description:
			"Compre em qualquer loja Plastlima e concorra a um Kit Churrasco. Cadastre-se na página oficial da promoção de mês dos pais. Sorteio em 31 de agosto.",
	},
};
