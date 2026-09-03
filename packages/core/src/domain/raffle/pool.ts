/**
 * Grupo em que a pessoa concorre dentro da mesma campanha.
 *
 * A campanha da TV entrega dois aparelhos: um sorteado entre quem compra no
 * Centro de Distribuição (atacado) e outro entre quem compra nas lojas. São
 * duas apurações independentes — mas **uma campanha só**, de propósito.
 *
 * O motivo é o índice único `(campaignId, phone)`: com uma campanha, é o próprio
 * banco que garante a regra "uma pessoa concorre em um grupo apenas". Se cada
 * grupo fosse uma campanha, essa garantia viraria checagem no código, com a
 * janela de corrida que o índice fecha de graça.
 */
export const RAFFLE_POOLS = ["cd", "unidades"] as const;

export type RafflePool = (typeof RAFFLE_POOLS)[number];

export function isRafflePool(value: string): value is RafflePool {
	return (RAFFLE_POOLS as readonly string[]).includes(value);
}
