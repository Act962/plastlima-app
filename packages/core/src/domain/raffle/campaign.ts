/** Configuração da campanha. É dado de configuração, não conteúdo editável. */
export type RaffleCampaign = {
	id: string;
	/** Instante em que as inscrições fecham. Depois disso o formulário some. */
	entriesCloseAt: Date;
};

export function areEntriesOpen(campaign: RaffleCampaign, now: Date): boolean {
	return now.getTime() < campaign.entriesCloseAt.getTime();
}
