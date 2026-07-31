import type { RaffleStore, StoreDirectory } from "@plastlima-app/core";
import { STORE_LOCATIONS } from "@/data/locations";

/**
 * Lojas participantes, derivadas da lista de unidades do site.
 *
 * O rótulo inclui a cidade porque há nomes repetidos entre estados — existem
 * duas "Loja Ceasa", uma em Teresina e outra em Timon.
 */
export const RAFFLE_STORE_OPTIONS = STORE_LOCATIONS.map((location) => ({
	value: location.id,
	label: `${location.name} — ${location.city}`,
	city: location.city,
	state: location.state,
}));

const STORES: RaffleStore[] = STORE_LOCATIONS.map((location) => ({
	id: location.id,
	name: location.name,
	city: location.city,
	state: location.state,
}));

/**
 * Implementação da porta do domínio.
 *
 * Hoje lê da constante do site; quando o CMS existir, passa a ler do banco sem
 * que o caso de uso mude.
 */
export const storeDirectory: StoreDirectory = {
	findById(storeId: string): RaffleStore | null {
		return STORES.find((store) => store.id === storeId) ?? null;
	},
};
