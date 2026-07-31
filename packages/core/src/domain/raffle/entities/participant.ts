import { fail, ok, type Result } from "../../shared/result";
import { InvalidParticipantError } from "../errors";
import type { RaffleStore } from "../store-directory";
import { PhoneNumber } from "../value-objects/phone-number";

const MIN_NAME_LENGTH = 3;

/** Forma plana da entidade, usada pelos mappers de persistência e pela UI. */
export type ParticipantSnapshot = {
	id: string | null;
	campaignId: string;
	name: string;
	phone: string;
	phoneDisplay: string;
	storeId: string;
	storeName: string;
	city: string;
	state: string;
	receiptImage: string | null;
	participationCount: number;
	acceptedTermsAt: Date;
	createdAt: Date;
	lastParticipatedAt: Date;
};

type ParticipantProps = {
	campaignId: string;
	name: string;
	phone: PhoneNumber;
	store: RaffleStore;
	receiptImage: string | null;
	participationCount: number;
	acceptedTermsAt: Date;
	createdAt: Date;
	lastParticipatedAt: Date;
};

type CreateParticipantInput = {
	campaignId: string;
	name: string;
	phone: PhoneNumber;
	store: RaffleStore;
	receiptImage?: string | null;
	now: Date;
};

/**
 * Uma pessoa inscrita na campanha.
 *
 * `id` é `null` enquanto a participação não foi persistida — no MongoDB é o
 * Prisma que gera o `_id`, então o domínio não inventa identidade.
 */
export class Participant {
	private constructor(
		private props: ParticipantProps,
		readonly id: string | null,
	) {}

	static create(
		input: CreateParticipantInput,
	): Result<Participant, InvalidParticipantError> {
		const name = input.name.trim().replace(/\s+/g, " ");

		if (name.length < MIN_NAME_LENGTH) {
			return fail(
				new InvalidParticipantError(
					`nome precisa de ao menos ${MIN_NAME_LENGTH} caracteres`,
				),
			);
		}

		if (input.campaignId.trim().length === 0) {
			return fail(new InvalidParticipantError("campanha não informada"));
		}

		return ok(
			new Participant(
				{
					campaignId: input.campaignId,
					name,
					phone: input.phone,
					store: input.store,
					receiptImage: input.receiptImage ?? null,
					participationCount: 1,
					acceptedTermsAt: input.now,
					createdAt: input.now,
					lastParticipatedAt: input.now,
				},
				null,
			),
		);
	}

	/** Reconstitui a partir do banco. Não revalida — o dado já passou por `create`. */
	static restore(snapshot: ParticipantSnapshot): Participant {
		return new Participant(
			{
				campaignId: snapshot.campaignId,
				name: snapshot.name,
				phone: PhoneNumber.restore(snapshot.phone),
				store: {
					id: snapshot.storeId,
					name: snapshot.storeName,
					city: snapshot.city,
					state: snapshot.state,
				},
				receiptImage: snapshot.receiptImage,
				participationCount: snapshot.participationCount,
				acceptedTermsAt: snapshot.acceptedTermsAt,
				createdAt: snapshot.createdAt,
				lastParticipatedAt: snapshot.lastParticipatedAt,
			},
			snapshot.id,
		);
	}

	/**
	 * Registra uma nova participação de quem já está cadastrado.
	 *
	 * Só incrementa o contador e move a data — loja e cupom do primeiro cadastro
	 * são preservados, porque a participação original é o registro histórico.
	 * O contador é métrica de engajamento: uma pessoa continua valendo uma chance.
	 */
	registerAgain(at: Date): void {
		this.props.participationCount += 1;
		this.props.lastParticipatedAt = at;
	}

	get campaignId(): string {
		return this.props.campaignId;
	}

	get name(): string {
		return this.props.name;
	}

	get phone(): PhoneNumber {
		return this.props.phone;
	}

	get store(): RaffleStore {
		return this.props.store;
	}

	get participationCount(): number {
		return this.props.participationCount;
	}

	get receiptImage(): string | null {
		return this.props.receiptImage;
	}

	toSnapshot(): ParticipantSnapshot {
		return {
			id: this.id,
			campaignId: this.props.campaignId,
			name: this.props.name,
			phone: this.props.phone.value,
			phoneDisplay: this.props.phone.display,
			storeId: this.props.store.id,
			storeName: this.props.store.name,
			city: this.props.store.city,
			state: this.props.store.state,
			receiptImage: this.props.receiptImage,
			participationCount: this.props.participationCount,
			acceptedTermsAt: this.props.acceptedTermsAt,
			createdAt: this.props.createdAt,
			lastParticipatedAt: this.props.lastParticipatedAt,
		};
	}
}
