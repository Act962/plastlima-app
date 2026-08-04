import type { AboutRichTextSegment } from "./about";

/**
 * Conversão entre `RichTextSegment[]` e uma string com `**negrito**`.
 *
 * O modelo de texto do site é só texto + ênfase (spec §6.4). Em vez de um editor
 * WYSIWYG completo, o painel edita cada parágrafo como texto simples com a
 * convenção `**...**` para negrito, e estas funções fazem a ponte para o dado
 * limpo do banco. Um Tiptap restrito a parágrafo+negrito pode substituir a
 * textarea depois sem mudar o formato armazenado.
 */

/** `RichTextSegment[]` → string editável, com trechos em negrito entre `**`. */
export function segmentsToMarkdown(segments: AboutRichTextSegment[]): string {
	return segments
		.map((segment) =>
			typeof segment === "string" ? segment : `**${segment.text}**`,
		)
		.join("");
}

/**
 * String com `**negrito**` → `RichTextSegment[]` normalizado.
 *
 * Junta trechos de texto puro vizinhos e descarta vazios, para o dado no banco
 * ficar mínimo e estável (o mesmo texto sempre gera os mesmos segmentos).
 */
export function markdownToSegments(text: string): AboutRichTextSegment[] {
	const segments: AboutRichTextSegment[] = [];
	// Divide mantendo os delimitadores: partes ímpares são o conteúdo em negrito.
	const parts = text.split(/\*\*(.+?)\*\*/g);

	parts.forEach((part, index) => {
		const isBold = index % 2 === 1;

		if (part.length === 0) {
			return;
		}

		if (isBold) {
			segments.push({ text: part, emphasis: true });
			return;
		}

		const previous = segments.at(-1);

		if (typeof previous === "string") {
			// Funde texto puro vizinho num único segmento.
			segments[segments.length - 1] = previous + part;
			return;
		}

		segments.push(part);
	});

	return segments;
}
