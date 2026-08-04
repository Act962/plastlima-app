import {
	type AuditEntry,
	type AuditLogger,
	DeleteAsset,
	ListAssets,
	type StorageProvider,
	UploadAsset,
} from "@plastlima-app/core";
import {
	getPrisma,
	PrismaMediaRepository,
	R2StorageProvider,
	r2ConfigFromEnv,
	SystemClock,
} from "@plastlima-app/infra";

const clock = new SystemClock();

/** Auditoria temporária no log do servidor (persistência é da Fase 6). */
class ConsoleAuditLogger implements AuditLogger {
	async record(entry: AuditEntry): Promise<void> {
		console.info(
			`[audit] ${entry.action} ${entry.entityType}:${entry.entityId} por ${entry.actor.email}`,
		);
	}
}

const audit = new ConsoleAuditLogger();

function repository(): PrismaMediaRepository {
	return new PrismaMediaRepository(getPrisma());
}

/** Provedor R2, ou `null` se as variáveis não estiverem configuradas. */
function storage(): StorageProvider | null {
	const config = r2ConfigFromEnv();
	return config === null ? null : new R2StorageProvider(config);
}

/** Se o upload está disponível (R2 configurado). */
export function isMediaConfigured(): boolean {
	return r2ConfigFromEnv() !== null;
}

export function createListAssets(): ListAssets {
	return new ListAssets(repository());
}

export function createUploadAsset(): UploadAsset | null {
	const provider = storage();
	return provider === null
		? null
		: new UploadAsset(repository(), provider, audit, clock);
}

export function createDeleteAsset(): DeleteAsset | null {
	const provider = storage();
	return provider === null
		? null
		: new DeleteAsset(repository(), provider, audit);
}
