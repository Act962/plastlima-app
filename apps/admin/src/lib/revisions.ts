/** Tipos compartilhados entre as telas de edição e o drawer de histórico. */

/** Uma revisão no histórico, já serializada para a interface. */
export type RevisionSummary = {
	version: number;
	createdBy: string;
	createdAt: string;
	note: string | null;
};

export type RollbackResult =
	| { ok: true; version: number; restoredFrom: number }
	| { ok: false; message: string };
