import {
	areEntriesOpen,
	type RaffleCampaign,
} from "../../domain/raffle/campaign";
import { Participant } from "../../domain/raffle/entities/participant";
import {
	CampaignClosedError,
	DuplicateParticipantError,
	type RegistrationError,
	UnknownStoreError,
} from "../../domain/raffle/errors";
import type { ParticipantRepository } from "../../domain/raffle/repositories/participant-repository";
import type { StoreDirectory } from "../../domain/raffle/store-directory";
import { PhoneNumber } from "../../domain/raffle/value-objects/phone-number";
import { fail, ok, type Result } from "../../domain/shared/result";
import type { Clock } from "../ports/clock";

export type RegisterParticipationInput = {
	name: string;
	/** Telefone cru, exatamente como o usuário digitou. */
	phone: string;
	storeId: string;
	/** Data URL da imagem do cupom, já comprimida pelo navegador. */
	receiptImage?: string | null;
};

export type RegisterParticipationOutput = {
	/** `false` quando o telefone já estava cadastrado — o fluxo segue igual. */
	isNewParticipant: boolean;
	participationCount: number;
};

/**
 * Registra uma participação na campanha.
 *
 * A regra central é a deduplicação por telefone: quem já se cadastrou não vira
 * um segundo registro, apenas incrementa o contador de participações.
 */
export class RegisterParticipation {
	constructor(
		private readonly participants: ParticipantRepository,
		private readonly stores: StoreDirectory,
		private readonly clock: Clock,
		private readonly campaign: RaffleCampaign,
	) {}

	async execute(
		input: RegisterParticipationInput,
	): Promise<Result<RegisterParticipationOutput, RegistrationError>> {
		const now = this.clock.now();

		if (!areEntriesOpen(this.campaign, now)) {
			return fail(new CampaignClosedError(this.campaign.entriesCloseAt));
		}

		const phoneResult = PhoneNumber.create(input.phone);

		if (!phoneResult.ok) {
			return phoneResult;
		}

		const phone = phoneResult.value;
		const store = this.stores.findById(input.storeId);

		if (store === null) {
			return fail(new UnknownStoreError(input.storeId));
		}

		const existing = await this.participants.findByPhone(
			this.campaign.id,
			phone.value,
		);

		if (existing !== null) {
			return ok(await this.countAnotherParticipation(existing, now));
		}

		const participant = Participant.create({
			campaignId: this.campaign.id,
			name: input.name,
			phone,
			store,
			receiptImage: input.receiptImage,
			now,
		});

		if (!participant.ok) {
			return participant;
		}

		try {
			const created = await this.participants.create(participant.value);

			return ok({
				isNewParticipant: true,
				participationCount: created.participationCount,
			});
		} catch (error) {
			if (!(error instanceof DuplicateParticipantError)) {
				throw error;
			}

			// Corrida: outra submissão do mesmo telefone gravou entre o
			// `findByPhone` e o `create`. O índice único do banco barrou, então
			// recarregamos e tratamos como participação repetida.
			const concurrent = await this.participants.findByPhone(
				this.campaign.id,
				phone.value,
			);

			if (concurrent === null) {
				throw error;
			}

			return ok(await this.countAnotherParticipation(concurrent, now));
		}
	}

	private async countAnotherParticipation(
		participant: Participant,
		now: Date,
	): Promise<RegisterParticipationOutput> {
		participant.registerAgain(now);

		const updated = await this.participants.update(participant);

		return {
			isNewParticipant: false,
			participationCount: updated.participationCount,
		};
	}
}
