import type { Actor } from "../../domain/shared/actor";
import type { JsonValue } from "../../domain/shared/json";

/** Uma ação de escrita a registrar para auditoria (LGPD e rastreabilidade). */
export type AuditEntry = {
	actor: Actor;
	/** Ação estável, ex.: `content.publish`, `content.rollback`, `content.save`. */
	action: string;
	entityType: string;
	entityId: string;
	/** Contexto opcional da mudança (ex.: `{ version: 3 }`). */
	diff?: JsonValue;
};

/**
 * Porta de registro de auditoria.
 *
 * Toda ação de escrita passa por aqui com `actorId`/`actorEmail`. É porta para
 * o caso de uso não depender de como (nem onde) o log é gravado — em teste, um
 * dublê que só acumula as entradas basta para afirmar que a ação foi registrada.
 */
export interface AuditLogger {
	record(entry: AuditEntry): Promise<void>;
}
