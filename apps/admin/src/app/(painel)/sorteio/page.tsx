import {
	areEntriesOpen,
	POOL_LABELS,
	type RafflePool,
	splitByEligibility,
} from "@plastlima-app/core";
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

type PageProps = {
	searchParams: Promise<{ grupo?: string }>;
};

/**
 * O grupo padrão é o Centro de Distribuição só por ser o menor: abrir a tela já
 * apontada para o grupo grande convidaria a apurar o sorteio errado por engano.
 */
const DEFAULT_POOL: RafflePool = "cd";

export default async function SorteioPage({ searchParams }: PageProps) {
	await requireActor();

	const { grupo } = await searchParams;
	const pool: RafflePool =
		grupo === "cd" || grupo === "unidades" ? grupo : DEFAULT_POOL;

	const candidates = await createParticipantRepository().listForDraw(
		ADMIN_CAMPAIGN.id,
		pool,
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
			pool={pool}
			poolLabel={POOL_LABELS[pool]}
			totalEligible={split.eligible.length}
		/>
	);
}
