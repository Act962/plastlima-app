import { z } from "zod";
import { PhoneNumber } from "../domain/raffle/value-objects/phone-number";

/**
 * Teto do data URL do cupom.
 *
 * O navegador comprime para ~200KB antes de enviar (ver `compress-image.ts` no
 * app web), o que em base64 dá ~270 mil caracteres. O limite generoso aqui é a
 * rede de segurança do servidor contra quem burlar a compressão do cliente — o
 * body de uma Server Action tem 1MB.
 */
export const MAX_RECEIPT_DATA_URL_LENGTH = 800_000;

const RECEIPT_DATA_URL_PATTERN =
	/^data:image\/(jpeg|png|webp);base64,[\w+/=]+$/;

/**
 * Contrato do formulário de participação.
 *
 * É o mesmo schema usado pelo react-hook-form no cliente e pela Server Action no
 * servidor — validar de novo no servidor não é redundância, é a única validação
 * que não dá para burlar.
 */
export const raffleRegistrationSchema = z.object({
	name: z
		.string()
		.trim()
		.min(3, "Informe seu nome completo.")
		.max(120, "Nome muito longo."),

	phone: z
		.string()
		.trim()
		.min(1, "Informe seu WhatsApp.")
		.refine(PhoneNumber.isValid, "Informe um WhatsApp válido com DDD."),

	storeId: z.string().trim().min(1, "Selecione a loja onde você comprou."),

	receiptImage: z
		.string()
		.regex(RECEIPT_DATA_URL_PATTERN, "Envie uma imagem válida.")
		.max(MAX_RECEIPT_DATA_URL_LENGTH, "A imagem do cupom é muito grande.")
		.optional(),

	acceptedTerms: z
		.boolean()
		.refine(
			(accepted) => accepted,
			"É preciso aceitar o regulamento para participar.",
		),
});

export type RaffleRegistration = z.infer<typeof raffleRegistrationSchema>;
