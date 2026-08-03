/**
 * Número de uma revisão dentro de um documento.
 *
 * É value object porque carrega a invariante 4: a sequência começa em 1 e só
 * avança de um em um. Encapsular o incremento aqui impede que um caso de uso
 * gere `version` fora de ordem — o índice único `(documentId, version)` no banco
 * é a segunda barreira, não a primeira.
 */
export class RevisionNumber {
	private constructor(readonly value: number) {}

	/** O estado inicial: nenhum documento tem revisão até a primeira publicação. */
	static readonly NONE = new RevisionNumber(0);

	static restore(value: number): RevisionNumber {
		if (!Number.isInteger(value) || value < 0) {
			throw new Error(`Número de revisão inválido: ${value}`);
		}

		return new RevisionNumber(value);
	}

	/** O próximo número da sequência. */
	next(): RevisionNumber {
		return new RevisionNumber(this.value + 1);
	}

	get isNone(): boolean {
		return this.value === 0;
	}
}
