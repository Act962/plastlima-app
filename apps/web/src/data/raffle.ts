import type { RaffleCampaignContent, RaffleImage } from "@/types/raffle";

/**
 * Peça única da campanha, usada no hero e no pop-up.
 *
 * É a arte de rede social (4:5, em pé). O hero foi feito para uma peça
 * horizontal, então lá ela entra com largura limitada para não virar uma torre
 * ao lado do texto — ver `raffle-hero.tsx`.
 */
const RAFFLE_ART: RaffleImage = {
	src: "/banners/sorteio-tv-42.jpeg",
	alt: 'Arte da promoção Plastlima e Vinco: "Compre e concorra" a uma Smart TV de 42 polegadas na compra dos produtos Vinco.',
	width: 1122,
	height: 1402,
};

/**
 * Campanha "Duas TVs de 42" — outubro de 2026".
 *
 * A campanha entrega **dois aparelhos iguais**, sorteados separadamente: um
 * entre quem compra no Centro de Distribuição (atacado) e outro entre quem
 * compra nas lojas. É um cadastro só; o grupo sai de onde a pessoa comprou.
 *
 * A data de encerramento é a única configuração com efeito funcional: depois
 * dela a página deixa de exibir o formulário e a Server Action recusa envios.
 * O sorteio é em 16/10 e as inscrições fecham na véspera.
 *
 * A campanha tem uma arte só (`RAFFLE_ART`), a de rede social, servindo o hero e
 * o pop-up. Se um dia chegar uma peça horizontal feita para o hero, é só apontar
 * `hero.image` para ela.
 */
export const RAFFLE_CAMPAIGN: RaffleCampaignContent = {
	id: "tv-42-2026",
	prize: 'TV 42"',
	prizeCount: 2,
	drawDateLabel: "16 de outubro de 2026",
	entriesCloseAt: new Date("2026-10-15T23:59:59-03:00"),

	hero: {
		eyebrow: "Promoção Plastlima",
		title: 'Compre na Plastlima e concorra a uma TV 42"',
		lead: "São duas TVs: uma para quem compra no Centro de Distribuição e outra para quem compra nas lojas. Qualquer valor de compra já garante sua participação.",
		ctaLabel: "Quero participar",
		image: RAFFLE_ART,
	},

	steps: [
		{
			id: "compre",
			title: "Faça uma compra",
			description:
				"Qualquer valor já garante sua participação — no Centro de Distribuição ou em qualquer uma das nossas lojas.",
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
				"Informe seu nome, WhatsApp e onde você comprou. Se quiser, adicione seu CPF ou CNPJ.",
		},
		{
			id: "confirme",
			title: "Participação confirmada",
			description:
				"Pronto: você já está concorrendo à TV do seu grupo, no sorteio de 16 de outubro.",
		},
	],

	form: {
		title: "Faça seu cadastro e concorra",
		description:
			"Leva menos de um minuto. Usamos o WhatsApp apenas para avisar o ganhador. Comprou de novo? Cadastre outra vez com o mesmo número: cada compra vale mais uma chance.",

		poolChoice: {
			label: "Onde você comprou?",
			hint: "É isso que define de qual das duas TVs você concorre.",
			options: {
				cd: {
					label: "Centro de Distribuição",
					description: "Compras no atacado, direto do CD.",
				},
				unidades: {
					label: "Uma das nossas lojas",
					description: "Qualquer uma das 14 unidades.",
				},
			},
		},
	},

	confirmation: {
		title: "Parabéns!",
		message: "Sua participação foi registrada com sucesso. Agora é só torcer!",
		repeatMessage:
			"Esta é a sua {count}ª participação. Quanto mais você compra e se cadastra, mais chances tem de ganhar!",
		repeatHint:
			"Comprou de novo? Volte aqui e preencha o formulário com o mesmo WhatsApp — cada compra vale mais uma chance.",
		invitation:
			"Enquanto isso, aproveite para conhecer nossa linha completa de descartáveis, embalagens e utilidades.",
		ctaLabel: "Conheça nossos produtos",
	},

	closed: {
		title: "Inscrições encerradas",
		message:
			"O prazo de cadastro para o sorteio das TVs terminou. Fique de olho nas nossas redes: o resultado sai em breve e novas promoções estão a caminho.",
	},

	popup: {
		eyebrow: "Promoção Plastlima",
		title: 'Ganhe uma TV 42"!',
		message:
			"São duas TVs sorteadas em 16 de outubro: uma para clientes do Centro de Distribuição e outra para clientes das lojas. Compre e cadastre-se.",
		ctaLabel: "Quero participar",
		dismissLabel: "Agora não",
		image: RAFFLE_ART,
	},

	seo: {
		title: 'Sorteio de duas TVs 42"',
		description:
			'Compre na Plastlima e concorra a uma TV 42". São duas: uma para clientes do Centro de Distribuição e outra para clientes das lojas. Sorteio em 16 de outubro.',
	},
};
