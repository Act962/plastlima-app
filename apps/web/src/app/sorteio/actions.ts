"use server";

import { raffleRegistrationSchema } from "@plastlima-app/core/schemas";
import { redirect } from "next/navigation";
import { createRegisterParticipation } from "@/lib/raffle/registration";

export type RegistrationResult = {
	status: "error";
	message: string;
};

/** Cada erro de domínio vira uma frase que faz sentido para quem está no site. */
const ERROR_MESSAGES: Record<string, string> = {
	INVALID_PHONE: "Informe um WhatsApp válido com DDD.",
	UNKNOWN_STORE: "Selecione uma das lojas da lista.",
	CAMPAIGN_CLOSED: "As inscrições para este sorteio já encerraram.",
	INVALID_PARTICIPANT: "Confira os dados informados e tente de novo.",
};

const FALLBACK_MESSAGE =
	"Não foi possível registrar agora. Tente novamente em instantes.";

/**
 * Registra a participação.
 *
 * Revalida com o mesmo schema do cliente — validação no navegador é conveniência,
 * esta é a que não dá para burlar. Em caso de sucesso redireciona, para um F5 na
 * confirmação não reenviar o cadastro.
 */
export async function registerParticipationAction(
	input: unknown,
): Promise<RegistrationResult | undefined> {
	const parsed = raffleRegistrationSchema.safeParse(input);

	if (!parsed.success) {
		return {
			status: "error",
			message: parsed.error.issues[0]?.message ?? FALLBACK_MESSAGE,
		};
	}

	let result: Awaited<
		ReturnType<ReturnType<typeof createRegisterParticipation>["execute"]>
	>;

	try {
		result = await createRegisterParticipation().execute({
			name: parsed.data.name,
			phone: parsed.data.phone,
			storeId: parsed.data.storeId,
			receiptImage: parsed.data.receiptImage ?? null,
		});
	} catch (error) {
		console.error("[sorteio] falha ao registrar participação", error);
		return { status: "error", message: FALLBACK_MESSAGE };
	}

	if (!result.ok) {
		return {
			status: "error",
			message: ERROR_MESSAGES[result.error.code] ?? FALLBACK_MESSAGE,
		};
	}

	redirect("/sorteio/confirmacao");
}
