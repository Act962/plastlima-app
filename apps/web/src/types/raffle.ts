export type RaffleStep = {
	id: string;
	title: string;
	description: string;
};

/**
 * Arte da campanha.
 *
 * Opcional em todo lugar onde aparece: enquanto a peça não fica pronta, a tela
 * reserva o espaço com um marcador em vez de quebrar o layout ou apontar para um
 * arquivo que não existe.
 */
export type RaffleImage = {
	src: string;
	alt: string;
	width: number;
	height: number;
};

/** Como o formulário apresenta a escolha que define o grupo sorteado. */
export type RafflePoolChoiceContent = {
	label: string;
	hint: string;
	options: {
		/** Quem compra no Centro de Distribuição (atacado). */
		cd: { label: string; description: string };
		/** Quem compra em uma das lojas. */
		unidades: { label: string; description: string };
	};
};

/** Conteúdo e configuração da campanha de sorteio. */
export type RaffleCampaignContent = {
	/** Gravado junto de cada participação — permite uma segunda campanha depois. */
	id: string;
	prize: string;
	/** Quantos prêmios iguais saem — um por grupo sorteado. */
	prizeCount: number;
	/** Data do sorteio, já escrita para exibição. */
	drawDateLabel: string;
	/** Instante em que as inscrições fecham. Depois disso o formulário some. */
	entriesCloseAt: Date;
	hero: {
		eyebrow: string;
		title: string;
		lead: string;
		ctaLabel: string;
		image?: RaffleImage;
	};
	steps: RaffleStep[];
	form: {
		title: string;
		description: string;
		/** Pergunta que decide em qual dos dois sorteios a pessoa entra. */
		poolChoice: RafflePoolChoiceContent;
	};
	confirmation: {
		title: string;
		message: string;
		/**
		 * Substitui `message` quando o mesmo WhatsApp se cadastra de novo.
		 * `{count}` é trocado pelo número de participações acumuladas.
		 */
		repeatMessage: string;
		/** Convite a voltar depois da próxima compra. Só aparece para quem é novo. */
		repeatHint: string;
		invitation: string;
		ctaLabel: string;
	};
	closed: {
		title: string;
		message: string;
	};
	/** Pop-up de anúncio, exibido em todo o site enquanto as inscrições estiverem abertas. */
	popup: {
		eyebrow: string;
		title: string;
		message: string;
		ctaLabel: string;
		dismissLabel: string;
		image?: RaffleImage;
	};
	seo: {
		title: string;
		description: string;
	};
};
