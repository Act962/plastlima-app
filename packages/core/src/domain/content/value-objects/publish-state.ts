/**
 * Estado de publicação de um documento, como a interface precisa mostrá-lo.
 *
 * Alimenta o badge do topo da tela de edição (spec §6.2) e o estado do botão
 * *Publicar*: `PUBLISHED_DIRTY` é exatamente a condição em que publicar faz
 * sentido — o inverso da invariante 9.
 */
export type PublishStateValue =
	/** Nunca publicado — só existe rascunho. */
	| "UNPUBLISHED"
	/** Publicado e sem alterações pendentes; publicar de novo é rejeitado. */
	| "PUBLISHED_CLEAN"
	/** Publicado, mas o rascunho tem mudanças ainda não publicadas. */
	| "PUBLISHED_DIRTY";

const LABELS: Record<PublishStateValue, string> = {
	UNPUBLISHED: "Nunca publicado",
	PUBLISHED_CLEAN: "Publicado",
	PUBLISHED_DIRTY: "Rascunho não publicado",
};

export class PublishState {
	private constructor(readonly value: PublishStateValue) {}

	static readonly UNPUBLISHED = new PublishState("UNPUBLISHED");
	static readonly PUBLISHED_CLEAN = new PublishState("PUBLISHED_CLEAN");
	static readonly PUBLISHED_DIRTY = new PublishState("PUBLISHED_DIRTY");

	/** Rótulo em pt-BR para o badge da interface. */
	get label(): string {
		return LABELS[this.value];
	}

	/** Só há o que publicar quando existe diferença entre rascunho e publicado. */
	get canPublish(): boolean {
		return this.value !== "PUBLISHED_CLEAN";
	}
}
