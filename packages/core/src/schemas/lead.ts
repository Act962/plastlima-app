import { z } from "zod";

/**
 * Contratos dos formulários públicos.
 *
 * Ficam em `core` — e não no app web — porque são usados nos dois lados da
 * mesma submissão: pelo formulário no navegador e pela Server Action que grava.
 * Revalidar no servidor não é redundância, é a única validação que não dá para
 * burlar. Os limites de tamanho espelham as invariantes de `Lead`, para o
 * usuário ver "mensagem muito longa" no campo em vez de um erro genérico
 * depois do envio.
 */
const name = z
	.string()
	.trim()
	.min(2, "Informe seu nome.")
	.max(120, "Nome muito longo.");

const email = z
	.email("Informe um e-mail válido.")
	.max(160, "E-mail muito longo.");

export const contactMessageSchema = z.object({
	name,
	email,
	message: z
		.string()
		.trim()
		.min(10, "Escreva uma mensagem com pelo menos 10 caracteres.")
		.max(5000, "Mensagem muito longa."),
});

export const franchiseLeadSchema = z.object({
	name,
	email,
	phone: z
		.string()
		.trim()
		.min(8, "Informe um telefone válido.")
		.max(40, "Telefone muito longo."),
	state: z.string().trim().max(80, "Estado muito longo.").optional(),
	city: z.string().trim().max(80, "Cidade muito longa.").optional(),
	message: z.string().trim().max(5000, "Mensagem muito longa.").optional(),
});

export type ContactMessage = z.infer<typeof contactMessageSchema>;
export type FranchiseLead = z.infer<typeof franchiseLeadSchema>;
