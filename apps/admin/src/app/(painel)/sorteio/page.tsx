import { areEntriesOpen, splitByEligibility } from "@plastlima-app/core";
import type { Metadata } from "next";
import { DrawConsole } from "@/components/sorteio/draw-console";
import { requireActor } from "@/lib/auth-actor";
import {
	ADMIN_CAMPAIGN,
	createParticipantRepository,
} from "@/lib/participants";

export const metadata: Metadata = { title: "Sorteio" };

/** Quantos nomes alimentam a animação do sorteio. */
const SHUFFLE_SAMPLE_SIZE = 24;

/**
 * A apuração precisa dos números do momento, nunca de um cache: a tela é aberta
 * no dia do sorteio para decidir quem ganha.
 */
export const dynamic = "force-dynamic";

/**
 * Nomes que giram na animação enquanto o sorteio acontece.
 *
 * Só o primeiro nome, e espalhados pela lista inteira em vez dos 24 primeiros —
 * o giro fica parecido com a base real, sem exibir a lista de participantes numa
 * tela que costuma estar projetada para o cliente.
 */
function shuffleSample(names: string[]): string[] {
	if (names.length <= SHUFFLE_SAMPLE_SIZE) {
		return names.map(firstName);
	}

	const step = Math.floor(names.length / SHUFFLE_SAMPLE_SIZE);

	return Array.from({ length: SHUFFLE_SAMPLE_SIZE }, (_, index) =>
		firstName(names[index * step] ?? ""),
	);
}

function firstName(name: string): string {
	return name.trim().split(/\s+/)[0] ?? name;
}

export default async function SorteioPage() {
	await requireActor();

	const candidates = await createParticipantRepository().listForDraw(
		ADMIN_CAMPAIGN.id,
	);

	const split = splitByEligibility(candidates, {
		cutoff: ADMIN_CAMPAIGN.entriesCloseAt,
	});

	return (
		<DrawConsole
			campaignId={ADMIN_CAMPAIGN.id}
			closesAt={ADMIN_CAMPAIGN.entriesCloseAt.toISOString()}
			entriesOpen={areEntriesOpen(ADMIN_CAMPAIGN, new Date())}
			lateCount={split.afterCutoff.length}
			names={shuffleSample(split.eligible.map((one) => one.name))}
			totalEligible={split.eligible.length}
		/>
	);
}
