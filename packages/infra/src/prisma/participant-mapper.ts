import { isRafflePool, Participant } from "@plastlima-app/core";
import type { Participant as ParticipantRecord } from "@prisma/client";

/** Registro do banco → entidade de domínio. */
export function toDomain(record: ParticipantRecord): Participant {
	return Participant.restore({
		id: record.id,
		campaignId: record.campaignId,
		name: record.name,
		phone: record.phone,
		phoneDisplay: record.phoneDisplay,
		storeId: record.storeId,
		storeName: record.storeName,
		city: record.city,
		state: record.state,
		// Cadastro da campanha anterior não tem grupo: todos eram de loja, porque
		// o Centro de Distribuição nem era opção então.
		pool:
			record.pool !== null && isRafflePool(record.pool)
				? record.pool
				: "unidades",
		document: record.document,
		documentDisplay: record.documentDisplay,
		receiptImage: record.receiptImage,
		participationCount: record.participationCount,
		acceptedTermsAt: record.acceptedTermsAt,
		createdAt: record.createdAt,
		lastParticipatedAt: record.lastParticipatedAt,
	});
}

/** Entidade nova → dados de inserção. O `id` fica de fora: quem gera é o Mongo. */
export function toCreateData(participant: Participant) {
	const snapshot = participant.toSnapshot();

	return {
		campaignId: snapshot.campaignId,
		name: snapshot.name,
		phone: snapshot.phone,
		phoneDisplay: snapshot.phoneDisplay,
		storeId: snapshot.storeId,
		storeName: snapshot.storeName,
		city: snapshot.city,
		state: snapshot.state,
		pool: snapshot.pool,
		document: snapshot.document,
		documentDisplay: snapshot.documentDisplay,
		receiptImage: snapshot.receiptImage,
		participationCount: snapshot.participationCount,
		acceptedTermsAt: snapshot.acceptedTermsAt,
		createdAt: snapshot.createdAt,
		lastParticipatedAt: snapshot.lastParticipatedAt,
	};
}
