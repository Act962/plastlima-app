import { z } from "zod";

export const franchiseLeadSchema = z.object({
	name: z.string().trim().min(2, "Informe seu nome completo."),
	email: z.email("Informe um e-mail válido."),
	phone: z.string().trim().min(8, "Informe um telefone válido."),
	state: z.string().trim().optional(),
	city: z.string().trim().optional(),
	message: z.string().trim().optional(),
});

export const contactMessageSchema = z.object({
	name: z.string().trim().min(2, "Informe seu nome completo."),
	email: z.email("Informe um e-mail válido."),
	message: z
		.string()
		.trim()
		.min(10, "Escreva uma mensagem com pelo menos 10 caracteres."),
});

export type FranchiseLead = z.infer<typeof franchiseLeadSchema>;
export type ContactMessage = z.infer<typeof contactMessageSchema>;
