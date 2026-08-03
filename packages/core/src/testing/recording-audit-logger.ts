import type {
	AuditEntry,
	AuditLogger,
} from "../application/ports/audit-logger";

/**
 * Dublê que só acumula as entradas de auditoria, para o teste afirmar que a
 * ação foi registrada (e com qual `action`) sem depender de banco.
 */
export class RecordingAuditLogger implements AuditLogger {
	readonly entries: AuditEntry[] = [];

	async record(entry: AuditEntry): Promise<void> {
		this.entries.push(entry);
	}

	get actions(): string[] {
		return this.entries.map((entry) => entry.action);
	}
}
