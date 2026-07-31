export type RaffleStep = {
	id: string;
	title: string;
	description: string;
};

/** Conteúdo e configuração da campanha de sorteio. */
export type RaffleCampaignContent = {
	/** Gravado junto de cada participação — permite uma segunda campanha depois. */
	id: string;
	prize: string;
	/** Data do sorteio, já escrita para exibição. */
	drawDateLabel: string;
	/** Instante em que as inscrições fecham. Depois disso o formulário some. */
	entriesCloseAt: Date;
	hero: {
		eyebrow: string;
		title: string;
		lead: string;
		ctaLabel: string;
		image: { src: string; alt: string; width: number; height: number };
	};
	steps: RaffleStep[];
	form: {
		title: string;
		description: string;
	};
	confirmation: {
		title: string;
		message: string;
		invitation: string;
		ctaLabel: string;
	};
	closed: {
		title: string;
		message: string;
	};
	seo: {
		title: string;
		description: string;
	};
};
