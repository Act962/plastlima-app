/**
 * Resultado de uma submissão de formulário público.
 *
 * As Server Actions dos leads devolvem valor em vez de lançar: o erro de
 * domínio já vem traduzido para a frase que a pessoa vê no formulário.
 */
export type LeadActionResult =
	| { status: "success" }
	| { status: "error"; message: string };

export const LEAD_FALLBACK_MESSAGE =
	"Não foi possível enviar agora. Tente novamente em instantes.";

/**
 * Mensagem por código de erro de domínio.
 *
 * `INVALID_LEAD` é genérico de propósito: o schema Zod já barrou tudo que o
 * usuário consegue corrigir sozinho, então chegar aqui significa que o dado
 * passou pela fronteira e falhou numa invariante — não há campo a apontar.
 */
export const LEAD_ERROR_MESSAGES: Record<string, string> = {
	INVALID_LEAD: "Confira os dados informados e tente de novo.",
};
