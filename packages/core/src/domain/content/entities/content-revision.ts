import type { Actor } from "../../shared/actor";
import type { JsonValue } from "../../shared/json";

/** Forma plana da revisão, usada pelos mappers de persistência e pela UI. */
export type ContentRevisionSnapshot = {
	id: string | null;
	documentKey: string;
	version: number;
	/** O conteúdo publicado nesta versão — cópia imutável do `published`. */
	data: JsonValue;
	/** Versão do schema em que o conteúdo foi gravado (para migração na leitura). */
	schemaVersion: number;
	note: string | null;
	createdBy: string;
	createdAt: Date;
};

type ContentRevisionProps = {
	documentKey: string;
	version: number;
	data: JsonValue;
	schemaVersion: number;
	note: string | null;
	createdBy: string;
	createdAt: Date;
};

type CreateContentRevisionInput = {
	documentKey: string;
	version: number;
	data: JsonValue;
	schemaVersion: number;
	note?: string | null;
	actor: Actor;
	now: Date;
};

/**
 * Snapshot imutável do conteúdo no momento de uma publicação.
 *
 * É o que dá histórico e rollback: cada publicação (inclusive um rollback) grava
 * uma revisão nova, e o histórico nunca encolhe (invariante 3). A revisão nunca
 * é editada depois de criada — não há setters.
 */
export class ContentRevision {
	private constructor(
		private readonly props: ContentRevisionProps,
		readonly id: string | null,
	) {}

	static create(input: CreateContentRevisionInput): ContentRevision {
		return new ContentRevision(
			{
				documentKey: input.documentKey,
				version: input.version,
				data: input.data,
				schemaVersion: input.schemaVersion,
				note: input.note ?? null,
				createdBy: input.actor.email,
				createdAt: input.now,
			},
			null,
		);
	}

	/** Reconstitui a partir do banco. */
	static restore(snapshot: ContentRevisionSnapshot): ContentRevision {
		return new ContentRevision(
			{
				documentKey: snapshot.documentKey,
				version: snapshot.version,
				data: snapshot.data,
				schemaVersion: snapshot.schemaVersion,
				note: snapshot.note,
				createdBy: snapshot.createdBy,
				createdAt: snapshot.createdAt,
			},
			snapshot.id,
		);
	}

	get documentKey(): string {
		return this.props.documentKey;
	}

	get version(): number {
		return this.props.version;
	}

	get data(): JsonValue {
		return this.props.data;
	}

	get schemaVersion(): number {
		return this.props.schemaVersion;
	}

	get note(): string | null {
		return this.props.note;
	}

	get createdBy(): string {
		return this.props.createdBy;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	toSnapshot(): ContentRevisionSnapshot {
		return {
			id: this.id,
			documentKey: this.props.documentKey,
			version: this.props.version,
			data: this.props.data,
			schemaVersion: this.props.schemaVersion,
			note: this.props.note,
			createdBy: this.props.createdBy,
			createdAt: this.props.createdAt,
		};
	}
}
