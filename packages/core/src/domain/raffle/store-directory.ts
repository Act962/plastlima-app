import type { RafflePool } from "./pool";

/** Loja elegível para a campanha, na forma mínima que o domínio precisa. */
export type RaffleStore = {
	id: string;
	name: string;
	city: string;
	state: string;
	/**
	 * Grupo em que quem comprou aqui concorre.
	 *
	 * Vive na loja, e não num campo separado do formulário, porque assim o grupo
	 * é **derivado** de onde a pessoa comprou em vez de declarado à parte. Não há
	 * como o cliente mandar uma loja e um grupo que se contradizem: existe uma
	 * fonte de verdade só.
	 */
	pool: RafflePool;
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
