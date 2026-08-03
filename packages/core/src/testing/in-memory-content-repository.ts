import { ContentDocument } from "../domain/content/entities/content-document";
import { ContentRevision } from "../domain/content/entities/content-revision";
import type { ContentRepository } from "../domain/content/repositories/content-repository";
import type { ContentKey } from "../domain/content/value-objects/content-key";
import type { JsonValue } from "../domain/shared/json";

/**
 * Dublê de teste do repositório de conteúdo.
 *
 * Implementa a mesma interface da produção — inclusive a atomicidade de
 * `persistPublication` (documento + revisão gravados juntos) e a unicidade de
 * `(key, version)`, sem a qual o teste da sequência de revisões não teria como
 * afirmar nada.
 */
export class InMemoryContentRepository implements ContentRepository {
	private readonly documents = new Map<string, ContentDocument>();
	private readonly revisions = new Map<string, ContentRevision[]>();
	private sequence = 0;

	async findByKey(key: ContentKey): Promise<ContentDocument | null> {
		const stored = this.documents.get(key.value);

		return stored ? ContentDocument.restore(stored.toSnapshot()) : null;
	}

	async findPublished(key: ContentKey): Promise<JsonValue | null> {
		return this.documents.get(key.value)?.published ?? null;
	}

	async saveDraft(document: ContentDocument): Promise<ContentDocument> {
		return this.persistDocument(document);
	}

	async persistPublication(
		document: ContentDocument,
		revision: ContentRevision,
	): Promise<ContentDocument> {
		const list = this.revisions.get(document.key.value) ?? [];

		if (list.some((existing) => existing.version === revision.version)) {
			throw new Error(
				`Revisão ${revision.version} já existe em '${document.key.value}'`,
			);
		}

		this.sequence += 1;

		const storedRevision = ContentRevision.restore({
			...revision.toSnapshot(),
			id: `revision-${this.sequence}`,
		});

		this.revisions.set(document.key.value, [...list, storedRevision]);

		return this.persistDocument(document);
	}

	async listRevisions(key: ContentKey): Promise<ContentRevision[]> {
		const list = this.revisions.get(key.value) ?? [];

		return [...list]
			.sort((a, b) => b.version - a.version)
			.map((revision) => ContentRevision.restore(revision.toSnapshot()));
	}

	async findRevision(
		key: ContentKey,
		version: number,
	): Promise<ContentRevision | null> {
		const match = this.revisions
			.get(key.value)
			?.find((revision) => revision.version === version);

		return match ? ContentRevision.restore(match.toSnapshot()) : null;
	}

	private persistDocument(document: ContentDocument): ContentDocument {
		const snapshot = document.toSnapshot();

		if (snapshot.id === null) {
			this.sequence += 1;
			snapshot.id = `document-${this.sequence}`;
		}

		const stored = ContentDocument.restore(snapshot);

		this.documents.set(snapshot.key, stored);

		return ContentDocument.restore(stored.toSnapshot());
	}

	/** Quantidade de documentos — atalho de asserção para os testes. */
	get size(): number {
		return this.documents.size;
	}

	/**
	 * Leitura síncrona do publicado — atalho para o teste inspecionar o estado
	 * dentro do gancho `onInvalidate` e afirmar a ordem "persistir antes de
	 * invalidar".
	 */
	currentPublished(key: string): JsonValue | null {
		return this.documents.get(key)?.published ?? null;
	}
}
