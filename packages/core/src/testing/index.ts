import type { Clock } from "../application/ports/clock";
import type {
	RaffleStore,
	StoreDirectory,
} from "../domain/raffle/store-directory";

export { InMemoryParticipantRepository } from "./in-memory-participant-repository";

/** Relógio parado, para posicionar o teste antes ou depois do encerramento. */
export class FixedClock implements Clock {
	constructor(private current: Date) {}

	now(): Date {
		return this.current;
	}

	travelTo(date: Date): void {
		this.current = date;
	}
}

export class InMemoryStoreDirectory implements StoreDirectory {
	constructor(private readonly stores: RaffleStore[]) {}

	findById(storeId: string): RaffleStore | null {
		return this.stores.find((store) => store.id === storeId) ?? null;
	}
}
