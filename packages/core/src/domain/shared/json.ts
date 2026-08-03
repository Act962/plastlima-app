/**
 * Um valor JSON qualquer — o que realmente atravessa a fronteira do banco.
 *
 * O conteúdo de cada documento (`draft`, `published`, `data` de uma revisão) é
 * gravado como JSON e revalidado na leitura pelo schema Zod da respectiva `key`.
 * O domínio o trata como opaco de propósito: quem conhece o formato de `home` é
 * o schema em `src/schemas/content`, não a entidade `ContentDocument`.
 */
export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue };
