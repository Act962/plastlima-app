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
	HttpRevalidationClient,
	PrismaContentRepository,
	SystemClock,
} from "@plastlima-app/infra";

const validator = new ZodContentValidator();
const clock = new SystemClock();

/**
 * Invalidação de cache local: só registra a intenção.
 *
 * Usada quando `REVALIDATE_SECRET` não está configurado — desenvolvimento sem o
 * site rodando. Publicar já grava a revisão de qualquer forma; a invalidação é
 * o que faz o site refletir na hora, e sem ela o ISR do site renova sozinho.
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

/**
 * Fala com o site real se houver segredo; senão, só loga. O site em
 * desenvolvimento é `http://localhost:3001` (porta do `dev:web`).
 */
function buildCacheInvalidator(): CacheInvalidator {
	const secret = process.env.REVALIDATE_SECRET;

	if (!secret) {
		return new LoggingCacheInvalidator();
	}

	const baseUrl = process.env.PUBLIC_SITE_URL ?? "http://localhost:3001";
	return new HttpRevalidationClient(baseUrl, secret);
}

const cache = buildCacheInvalidator();
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
