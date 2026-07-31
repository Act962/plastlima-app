/** Loja elegível para a campanha, na forma mínima que o domínio precisa. */
export type RaffleStore = {
	id: string;
	name: string;
	city: string;
	state: string;
};

/**
 * Porta que resolve o `storeId` enviado pelo formulário.
 *
 * Existe para o domínio poder garantir que toda participação aponta para uma
 * loja real — sem isso, um `storeId` forjado entraria no banco. Quem implementa
 * decide a origem: hoje é a lista estática do site, amanhã pode ser o CMS.
 */
export interface StoreDirectory {
	findById(storeId: string): RaffleStore | null;
}
