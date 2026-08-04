import {
	ContentDocument,
	type ContentKeyValue,
	ContentRevision,
	type JsonValue,
} from "@plastlima-app/core";
import type {
	ContentDocument as ContentDocumentRecord,
	ContentRevision as ContentRevisionRecord,
	Prisma,
} from "@prisma/client";

/**
 * Registro do banco → agregado de domínio.
 *
 * O `key` é reconstituído sem revalidar: só chega aqui o que foi gravado por um
 * `ContentKey` válido, então dado do nosso próprio banco é confiável.
 */
export function toDomainDocument(
	record: ContentDocumentRecord,
): ContentDocument {
	return ContentDocument.restore({
		id: record.id,
		key: record.key as ContentKeyValue,
		schemaVersion: record.schemaVersion,
		draft: record.draft as JsonValue,
		published: (record.published ?? null) as JsonValue | null,
		currentVersion: record.currentVersion,
		publishedAt: record.publishedAt,
		publishedBy: record.publishedBy,
		updatedAt: record.updatedAt,
		updatedBy: record.updatedBy,
	});
}

/**
 * Registro de revisão → entidade de domínio.
 *
 * A revisão referencia o documento por `documentId` (ObjectId) no banco, mas o
 * domínio a conhece pela `key` — por isso a `key` é injetada por quem já a tem
 * (o repositório, que consultou por ela).
 */
export function toDomainRevision(
	record: ContentRevisionRecord,
	documentKey: string,
): ContentRevision {
	return ContentRevision.restore({
		id: record.id,
		documentKey,
		version: record.version,
		data: record.data as JsonValue,
		schemaVersion: record.schemaVersion,
		note: record.note,
		createdBy: record.createdBy,
		createdAt: record.createdAt,
	});
}

/**
 * Traduz o JSON opaco do domínio para o formato de entrada do Prisma.
 *
 * No provider MongoDB um campo `Json?` aceita `null` diretamente (NULL no
 * banco), sem o sentinela `Prisma.DbNull` exigido pelos bancos SQL. `null` aqui
 * significa "documento nunca publicado".
 */
export function toInputJson(value: JsonValue): Prisma.InputJsonValue {
	return value as Prisma.InputJsonValue;
}

export function toNullableInputJson(
	value: JsonValue | null,
): Prisma.InputJsonValue | null {
	return value === null ? null : (value as Prisma.InputJsonValue);
}
