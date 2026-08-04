import {
	type AuditEntry,
	type AuditLogger,
	type CacheInvalidator,
	GetDraft,
	ListRevisions,
	PublishDocument,
	RollbackToRevision,
	SaveDraft,
} from "@plastlima-app/core";
import { ZodContentValidator } from "@plastlima-app/core/schemas";
import {
	getPrisma,
	PrismaContentRepository,
	SystemClock,
} from "@plastlima-app/infra";

const validator = new ZodContentValidator();
const clock = new SystemClock();

/**
 * Invalidação de cache temporária: só registra a intenção.
 *
 * O adaptador real (`HttpRevalidationClient`, um `POST` para a rota de
 * revalidação do `apps/web`) chega na Fase 4, quando o site passa a ler do
 * banco. Até lá, publicar já grava a revisão — que é o que a Fase 3 valida.
 */
class LoggingCacheInvalidator implements CacheInvalidator {
	async invalidate(tags: string[]): Promise<void> {
		console.info("[cache] invalidaria as tags:", tags.join(", "));
	}
}

/**
 * Auditoria temporária no log do servidor.
 *
 * A persistência em `AuditLogEntry` é da Fase 6 (Leads + audit log). A porta já
 * está no lugar, então trocar o adaptador não toca nos casos de uso.
 */
class ConsoleAuditLogger implements AuditLogger {
	async record(entry: AuditEntry): Promise<void> {
		console.info(
			`[audit] ${entry.action} ${entry.entityType}:${entry.entityId} por ${entry.actor.email}`,
		);
	}
}

const cache = new LoggingCacheInvalidator();
const audit = new ConsoleAuditLogger();

/** Novo repositório por chamada; o `getPrisma()` por baixo é cacheado. */
function repository(): PrismaContentRepository {
	return new PrismaContentRepository(getPrisma());
}

export function createGetDraft(): GetDraft {
	return new GetDraft(repository());
}

export function createSaveDraft(): SaveDraft {
	return new SaveDraft(repository(), validator, clock, audit);
}

export function createPublishDocument(): PublishDocument {
	return new PublishDocument(repository(), validator, cache, clock, audit);
}

export function createListRevisions(): ListRevisions {
	return new ListRevisions(repository());
}

export function createRollbackToRevision(): RollbackToRevision {
	return new RollbackToRevision(repository(), cache, clock, audit);
}
