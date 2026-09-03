import { Lead, type LeadKind, type LeadStatus } from "@plastlima-app/core";
import type { Lead as LeadRecord } from "@prisma/client";

/**
 * Registro do banco → entidade de domínio.
 *
 * `kind` e `status` são `String` no Mongo (não há enum nativo que valha a pena
 * aqui), então a conversão acontece neste ponto e em nenhum outro: um valor
 * gravado fora da lista vira o padrão em vez de contaminar o domínio.
 */
export function toDomain(record: LeadRecord): Lead {
	return Lead.restore({
		id: record.id,
		kind: toKind(record.kind),
		name: record.name,
		email: record.email,
		phone: record.phone,
		phoneDigits: record.phoneDigits,
		state: record.state,
		city: record.city,
		message: record.message,
		status: toStatus(record.status),
		createdAt: record.createdAt,
		handledAt: record.handledAt,
		handledBy: record.handledBy,
	});
}

/** Entidade nova → dados de inserção. O `id` fica de fora: quem gera é o Mongo. */
export function toCreateData(lead: Lead) {
	const snapshot = lead.toSnapshot();

	return {
		kind: snapshot.kind,
		name: snapshot.name,
		email: snapshot.email,
		phone: snapshot.phone,
		phoneDigits: snapshot.phoneDigits,
		state: snapshot.state,
		city: snapshot.city,
		message: snapshot.message,
		status: snapshot.status,
		createdAt: snapshot.createdAt,
		handledAt: snapshot.handledAt,
		handledBy: snapshot.handledBy,
	};
}

function toKind(value: string): LeadKind {
	return value === "franchise" ? "franchise" : "contact";
}

function toStatus(value: string): LeadStatus {
	return value === "handled" ? "handled" : "new";
}
