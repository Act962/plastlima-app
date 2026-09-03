import type { RaffleStore, StoreDirectory } from "@plastlima-app/core";
import { STORE_LOCATIONS } from "@/data/locations";

/**
 * Id do Centro de Distribuição.
 *
 * O CD não é uma das unidades de `/unidades` — é a operação de atacado, e por
 * isso não entra em `STORE_LOCATIONS`. Aqui ele existe como uma "loja" do
 * diretório da campanha só para que o grupo sorteado seja **derivado** de onde a
 * pessoa comprou, em vez de ser um campo à parte que poderia contradizer a loja.
 */
export const DISTRIBUTION_CENTER_ID = "centro-distribuicao";

const DISTRIBUTION_CENTER: RaffleStore = {
	id: DISTRIBUTION_CENTER_ID,
	name: "Centro de Distribuição",
	city: "Teresina",
	state: "Piauí",
	pool: "cd",
};

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

const STORES: RaffleStore[] = [
	...STORE_LOCATIONS.map((location) => ({
		id: location.id,
		name: location.name,
		city: location.city,
		state: location.state,
		pool: "unidades" as const,
	})),
	DISTRIBUTION_CENTER,
];

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
