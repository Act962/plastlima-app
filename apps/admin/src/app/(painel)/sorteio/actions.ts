"use server";

import { randomUUID } from "node:crypto";
import type { DrawCriterion, DrawMode, DrawRecord } from "@plastlima-app/core";
import { requireActor } from "@/lib/auth-actor";
import { createDrawWinner } from "@/lib/participants";

export type DrawInput = {
	/** Vazio quando quem apura não informou semente pública: o servidor gera uma. */
	seed: string;
	criterion: DrawCriterion;
	excludedPhones: string;
	mode: DrawMode;
};

export type DrawOutcome =
	| { ok: true; record: DrawRecord }
	| { ok: false; message: string };

/**
 * Semente de quem não informou uma.
 *
 * Gerada no servidor, e não no navegador, para não depender de nada que o
 * cliente possa escolher. O prefixo deixa explícito na ata que ela nasceu aqui,
 * e não de uma fonte pública como a Loteria Federal.
 */
function generatedSeed(): string {
	return `auto-${randomUUID()}`;
}

/** Cada erro de domínio vira uma frase que faz sentido para quem está apurando. */
const ERROR_MESSAGES: Record<string, string> = {
	EMPTY_DRAW: "Nenhum participante elegível para sortear.",
	MISSING_SEED: "Não foi possível gerar a semente do sorteio.",
};

const FALLBACK_MESSAGE = "Não foi possível apurar agora. Tente novamente.";

/**
 * Roda o sorteio no servidor e devolve só a ata.
 *
 * A lista inteira de participantes nunca vai para o navegador: quem sorteia é o
 * caso de uso, aqui, e o que volta é o resultado — nome, telefone e loja de
 * quatro pessoas, não a base de dados pessoais inteira.
 */
export async function drawAction(input: DrawInput): Promise<DrawOutcome> {
	await requireActor();

	try {
		const result = await createDrawWinner().execute({
			...input,
			seed: input.seed.trim() || generatedSeed(),
		});

		if (!result.ok) {
			return {
				ok: false,
				message: ERROR_MESSAGES[result.error.code] ?? FALLBACK_MESSAGE,
			};
		}

		return { ok: true, record: result.value.record };
	} catch (error) {
		console.error("[sorteio] falha ao apurar", error);
		return { ok: false, message: FALLBACK_MESSAGE };
	}
}
