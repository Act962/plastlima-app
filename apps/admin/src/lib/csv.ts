/**
 * Serializa linhas para CSV no dialeto que o Excel brasileiro abre sem
 * perguntar nada: separador `;` e quebra de linha CRLF.
 */
export function toCsv(headers: string[], rows: string[][]): string {
	const lines = [headers, ...rows].map((columns) =>
		columns.map(escapeCell).join(";"),
	);

	return lines.join("\r\n");
}

function escapeCell(value: string): string {
	const needsQuotes = /[";\r\n]/.test(value);

	if (!needsQuotes) {
		return value;
	}

	return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Prefixa o BOM de UTF-8.
 *
 * Sem ele o Excel no Windows interpreta o arquivo como ANSI e "Parnaíba" chega
 * como "ParnaÃ­ba".
 */
export function withUtf8Bom(csv: string): string {
	return `﻿${csv}`;
}
