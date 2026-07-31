export type { Clock } from "./application/ports/clock";
export {
	ListParticipants,
	type ListParticipantsInput,
} from "./application/use-cases/list-participants";
export {
	RegisterParticipation,
	type RegisterParticipationInput,
	type RegisterParticipationOutput,
} from "./application/use-cases/register-participation";
export {
	areEntriesOpen,
	type RaffleCampaign,
} from "./domain/raffle/campaign";
export {
	Participant,
	type ParticipantSnapshot,
} from "./domain/raffle/entities/participant";
export {
	CampaignClosedError,
	DomainError,
	DuplicateParticipantError,
	InvalidParticipantError,
	InvalidPhoneError,
	type RegistrationError,
	UnknownStoreError,
} from "./domain/raffle/errors";
export type {
	ParticipantListQuery,
	ParticipantListResult,
	ParticipantRepository,
} from "./domain/raffle/repositories/participant-repository";
export type {
	RaffleStore,
	StoreDirectory,
} from "./domain/raffle/store-directory";
export { PhoneNumber } from "./domain/raffle/value-objects/phone-number";
export { fail, ok, type Result } from "./domain/shared/result";
