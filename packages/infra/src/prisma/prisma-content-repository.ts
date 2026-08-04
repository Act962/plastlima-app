import type {
	ContentDocument,
	ContentKey,
	ContentRepository,
	ContentRevision,
	JsonValue,
} from "@plastlima-app/core";
import type { PrismaClient } from "@prisma/client";
import {
	toDomainDocument,
	toDomainRevision,
	toInputJson,
	toNullableInputJson,
} from "./content-mapper";

export class PrismaContentRepository implements ContentRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findByKey(key: ContentKey): Promise<ContentDocument | null> {
		const record = await this.prisma.contentDocument.findUnique({
			where: { key: key.value },
		});

		return record === null ? null : toDomainDocument(record);
	}

	async findPublished(key: ContentKey): Promise<JsonValue | null> {
		const record = await this.prisma.contentDocument.findUnique({
			where: { key: key.value },
			select: { published: true },
		});

		if (record === null) {
			return null;
		}

		return (record.published ?? null) as JsonValue | null;
	}

	/**
	 * Cria ou atualiza o rascunho num único `upsert` sobre o índice de `key`.
	 *
	 * O upsert (em vez de create/update ramificado) fecha a corrida entre dois
	 * autosaves do mesmo documento novo, que de outra forma violariam o índice
	 * único de `key`. O ramo de atualização toca só o rascunho — nunca o
	 * publicado.
	 */
	async saveDraft(document: ContentDocument): Promise<ContentDocument> {
		const snapshot = document.toSnapshot();

		const record = await this.prisma.contentDocument.upsert({
			where: { key: snapshot.key },
			create: {
				key: snapshot.key,
				schemaVersion: snapshot.schemaVersion,
				draft: toInputJson(snapshot.draft),
				published: toNullableInputJson(snapshot.published),
				currentVersion: snapshot.currentVersion,
				publishedAt: snapshot.publishedAt,
				publishedBy: snapshot.publishedBy,
				updatedAt: snapshot.updatedAt,
				updatedBy: snapshot.updatedBy,
			},
			update: {
				draft: toInputJson(snapshot.draft),
				updatedAt: snapshot.updatedAt,
				updatedBy: snapshot.updatedBy,
			},
		});

		return toDomainDocument(record);
	}

	/**
	 * Publicação atômica: promove o documento e insere a revisão na mesma
	 * transação. Serve tanto a `PublishDocument` quanto a `RollbackToRevision`.
	 *
	 * A transação (que no MongoDB exige replica set) garante que documento e
	 * revisão andam juntos — gravar um sem o outro quebraria a sequência de
	 * `version` e o histórico. O índice único `(documentId, version)` é a segunda
	 * barreira, contra duas publicações simultâneas.
	 */
	async persistPublication(
		document: ContentDocument,
		revision: ContentRevision,
	): Promise<ContentDocument> {
		const docSnapshot = document.toSnapshot();

		if (docSnapshot.id === null) {
			// Só se publica o que já foi salvo como rascunho — o caso de uso carrega
			// o documento antes. Um id nulo aqui é erro de programação.
			throw new Error("Documento sem id não pode ser publicado.");
		}

		const revSnapshot = revision.toSnapshot();
		const documentId = docSnapshot.id;

		const [updated] = await this.prisma.$transaction([
			this.prisma.contentDocument.update({
				where: { id: documentId },
				data: {
					draft: toInputJson(docSnapshot.draft),
					published: toNullableInputJson(docSnapshot.published),
					currentVersion: docSnapshot.currentVersion,
					publishedAt: docSnapshot.publishedAt,
					publishedBy: docSnapshot.publishedBy,
					updatedAt: docSnapshot.updatedAt,
					updatedBy: docSnapshot.updatedBy,
				},
			}),
			this.prisma.contentRevision.create({
				data: {
					documentId,
					version: revSnapshot.version,
					data: toInputJson(revSnapshot.data),
					schemaVersion: revSnapshot.schemaVersion,
					note: revSnapshot.note,
					createdBy: revSnapshot.createdBy,
					createdAt: revSnapshot.createdAt,
				},
			}),
		]);

		return toDomainDocument(updated);
	}

	async listRevisions(key: ContentKey): Promise<ContentRevision[]> {
		const records = await this.prisma.contentRevision.findMany({
			where: { document: { key: key.value } },
			orderBy: { version: "desc" },
		});

		return records.map((record) => toDomainRevision(record, key.value));
	}

	async findRevision(
		key: ContentKey,
		version: number,
	): Promise<ContentRevision | null> {
		const record = await this.prisma.contentRevision.findFirst({
			where: { document: { key: key.value }, version },
		});

		return record === null ? null : toDomainRevision(record, key.value);
	}
}
