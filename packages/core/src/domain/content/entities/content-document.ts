import type { Actor } from "../../shared/actor";
import { deepEqual } from "../../shared/deep-equal";
import type { JsonValue } from "../../shared/json";
import { ContentKey, type ContentKeyValue } from "../value-objects/content-key";
import { PublishState } from "../value-objects/publish-state";
import { RevisionNumber } from "../value-objects/revision-number";
import { ContentRevision } from "./content-revision";

/** Forma plana do documento, usada pelos mappers de persistência e pela UI. */
export type ContentDocumentSnapshot = {
	id: string | null;
	key: ContentKeyValue;
	schemaVersion: number;
	draft: JsonValue;
	published: JsonValue | null;
	/** Maior `version` de revisão já criada; 0 enquanto nunca publicado. */
	currentVersion: number;
	publishedAt: Date | null;
	publishedBy: string | null;
	updatedAt: Date;
	updatedBy: string;
};

type ContentDocumentProps = {
	key: ContentKey;
	schemaVersion: number;
	draft: JsonValue;
	published: JsonValue | null;
	currentVersion: RevisionNumber;
	publishedAt: Date | null;
	publishedBy: string | null;
	updatedAt: Date;
	updatedBy: string;
};

type CreateContentDocumentInput = {
	key: ContentKey;
	schemaVersion: number;
	/** Conteúdo inicial do rascunho — normalmente o fallback em código. */
	draft: JsonValue;
	actor: Actor;
	now: Date;
};

/**
 * Raiz do agregado de conteúdo: um documento por área editável do site.
 *
 * Guarda dois JSONs — `draft` (o que o editor mexe) e `published` (o que o site
 * serve) — e concentra as transições de estado. Não conhece o *formato* de cada
 * `key`: a validação de shape é do schema Zod, aplicada na fronteira pelo caso
 * de uso `PublishDocument`. Aqui moram só as regras que valem para qualquer
 * conteúdo: sequência de revisões, promoção draft→published e detecção de
 * mudança.
 */
export class ContentDocument {
	private constructor(
		private props: ContentDocumentProps,
		readonly id: string | null,
	) {}

	static create(input: CreateContentDocumentInput): ContentDocument {
		return new ContentDocument(
			{
				key: input.key,
				schemaVersion: input.schemaVersion,
				draft: input.draft,
				published: null,
				currentVersion: RevisionNumber.NONE,
				publishedAt: null,
				publishedBy: null,
				updatedAt: input.now,
				updatedBy: input.actor.email,
			},
			null,
		);
	}

	/** Reconstitui a partir do banco. Não revalida — o dado já foi validado. */
	static restore(snapshot: ContentDocumentSnapshot): ContentDocument {
		return new ContentDocument(
			{
				key: ContentKey.restore(snapshot.key),
				schemaVersion: snapshot.schemaVersion,
				draft: snapshot.draft,
				published: snapshot.published,
				currentVersion: RevisionNumber.restore(snapshot.currentVersion),
				publishedAt: snapshot.publishedAt,
				publishedBy: snapshot.publishedBy,
				updatedAt: snapshot.updatedAt,
				updatedBy: snapshot.updatedBy,
			},
			snapshot.id,
		);
	}

	get key(): ContentKey {
		return this.props.key;
	}

	get schemaVersion(): number {
		return this.props.schemaVersion;
	}

	get draft(): JsonValue {
		return this.props.draft;
	}

	get published(): JsonValue | null {
		return this.props.published;
	}

	get currentVersion(): number {
		return this.props.currentVersion.value;
	}

	/** `true` quando o rascunho difere do publicado — a base da invariante 9. */
	hasUnpublishedChanges(): boolean {
		if (this.props.published === null) {
			return true;
		}

		return !deepEqual(this.props.draft, this.props.published);
	}

	publishState(): PublishState {
		if (this.props.published === null) {
			return PublishState.UNPUBLISHED;
		}

		return this.hasUnpublishedChanges()
			? PublishState.PUBLISHED_DIRTY
			: PublishState.PUBLISHED_CLEAN;
	}

	/** Atualiza o rascunho. Não toca no publicado — nada disso afeta o site. */
	saveDraft(draft: JsonValue, actor: Actor, now: Date): void {
		this.props.draft = draft;
		this.props.updatedAt = now;
		this.props.updatedBy = actor.email;
	}

	/**
	 * Promove o rascunho a publicado e devolve a revisão a persistir.
	 *
	 * Pressupõe que o chamador (`PublishDocument`) já validou o shape (invariante
	 * 1) e confirmou que há mudança (invariante 9). Sempre cria uma revisão com
	 * `version` incrementada (invariantes 2 e 4).
	 */
	publish(actor: Actor, now: Date, note?: string | null): ContentRevision {
		return this.promote(this.props.draft, actor, now, note ?? null);
	}

	/**
	 * Restaura o conteúdo de uma revisão anterior.
	 *
	 * Não apaga nada: cria uma revisão nova com o conteúdo antigo (invariante 3).
	 * O rascunho também passa a refletir o conteúdo restaurado, para o documento
	 * não ficar "sujo" logo após um rollback.
	 */
	rollbackTo(
		revision: ContentRevision,
		actor: Actor,
		now: Date,
	): ContentRevision {
		this.props.draft = revision.data;

		return this.promote(
			revision.data,
			actor,
			now,
			`Restaurado da versão ${revision.version}`,
		);
	}

	private promote(
		content: JsonValue,
		actor: Actor,
		now: Date,
		note: string | null,
	): ContentRevision {
		const nextVersion = this.props.currentVersion.next();

		this.props.published = content;
		this.props.currentVersion = nextVersion;
		this.props.publishedAt = now;
		this.props.publishedBy = actor.email;
		this.props.updatedAt = now;
		this.props.updatedBy = actor.email;

		return ContentRevision.create({
			documentKey: this.props.key.value,
			version: nextVersion.value,
			data: content,
			schemaVersion: this.props.schemaVersion,
			note,
			actor,
			now,
		});
	}

	toSnapshot(): ContentDocumentSnapshot {
		return {
			id: this.id,
			key: this.props.key.value,
			schemaVersion: this.props.schemaVersion,
			draft: this.props.draft,
			published: this.props.published,
			currentVersion: this.props.currentVersion.value,
			publishedAt: this.props.publishedAt,
			publishedBy: this.props.publishedBy,
			updatedAt: this.props.updatedAt,
			updatedBy: this.props.updatedBy,
		};
	}
}
