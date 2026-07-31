/** Um bloco de conteúdo dentro de uma seção de documento legal. */
export type PolicyBlock =
	| { type: "paragraph"; text: string }
	| { type: "list"; lead?: string; items: string[] };

/** Uma seção numerada do documento (título + blocos de conteúdo). */
export type PolicySection = {
	id: string;
	title: string;
	blocks: PolicyBlock[];
};

/** Documento legal completo, pronto para renderizar de forma data-driven. */
export type LegalDocument = {
	/** Data da última revisão, já formatada para exibição (ex.: "31 de julho de 2026"). */
	updatedAt: string;
	/** Parágrafos de abertura, antes das seções numeradas. */
	intro: string[];
	sections: PolicySection[];
};
