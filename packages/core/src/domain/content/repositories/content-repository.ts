import type { JsonValue } from "../../shared/json";
import type { ContentDocument } from "../entities/content-document";
import type { ContentRevision } from "../entities/content-revision";
import type { ContentKey } from "../value-objects/content-key";

/**
 * Porta de persistência do conteúdo.
 *
 * O domínio a declara; `packages/infra` a implementa com Prisma. É o que permite
 * testar os casos de uso sem banco, contra o dublê in-memory que respeita o
 * mesmo contrato — inclusive a atomicidade de `persistPublication`.
 */
export interface ContentRepository {
	/** Documento completo (rascunho + publicado + metadados) para edição. */
	findByKey(key: ContentKey): Promise<ContentDocument | null>;

	/**
	 * Apenas o JSON publicado, para o site consumir. `null` quando o documento
	 * não existe ou nunca foi publicado — o chamador cai no fallback em código.
	 */
	findPublished(key: ContentKey): Promise<JsonValue | null>;

	/** Cria ou atualiza o rascunho (upsert). Não mexe no publicado. */
	saveDraft(document: ContentDocument): Promise<ContentDocument>;

	/**
	 * Persiste uma publicação de forma atômica: grava o documento com o novo
	 * `published`/`currentVersion` e insere a revisão na mesma transação. Serve
	 * tanto a `PublishDocument` quanto a `RollbackToRevision`.
	 *
	 * A atomicidade importa: gravar o documento sem a revisão (ou vice-versa)
	 * quebraria a sequência de `version` e o histórico.
	 */
	persistPublication(
		document: ContentDocument,
		revision: ContentRevision,
	): Promise<ContentDocument>;

	/** Revisões do documento, da mais recente para a mais antiga. */
	listRevisions(key: ContentKey): Promise<ContentRevision[]>;

	/** Uma revisão específica pelo número de versão. */
	findRevision(
		key: ContentKey,
		version: number,
	): Promise<ContentRevision | null>;
}
