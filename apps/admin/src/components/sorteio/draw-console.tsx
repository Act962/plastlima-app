"use client";

import type { DrawCriterion, DrawMode, DrawRecord } from "@plastlima-app/core";
import { Button } from "@plastlima-app/ui/components/button";
import { cn } from "@plastlima-app/ui/lib/utils";
import {
	Dices,
	Download,
	Maximize2,
	RotateCcw,
	ShieldCheck,
	Timer,
	Trophy,
	Users,
	X,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { type DrawInput, drawAction } from "@/app/(painel)/sorteio/actions";

/** Duração do giro de nomes. Curto para não cansar, longo para criar expectativa. */
const SPIN_DURATION_MS = 1900;
const SPIN_INTERVAL_MS = 80;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
	dateStyle: "long",
	timeStyle: "short",
	timeZone: "America/Fortaleza",
});

const fieldClassName =
	"w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring";

type Props = {
	campaignId: string;
	closesAt: string;
	entriesOpen: boolean;
	totalEligible: number;
	lateCount: number;
	names: string[];
};

type Result = { record: DrawRecord; mode: DrawMode };

function prefersReducedMotion(): boolean {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Esconde o miolo do telefone.
 *
 * A tela cheia costuma estar projetada ou transmitida ao vivo: o WhatsApp do
 * ganhador não pode ir junto. Quem conduz vê o número completo no painel.
 */
function maskPhone(display: string): string {
	return display.replace(/\d(?=[\d\s-]*\d\d$)/g, (digit, index: number) =>
		index < 4 ? digit : "•",
	);
}

function downloadRecord(record: DrawRecord): void {
	const blob = new Blob([`${JSON.stringify(record, null, "\t")}\n`], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");

	link.href = url;
	link.download = `ata-${record.campanha}.json`;
	link.click();
	URL.revokeObjectURL(url);
}

export function DrawConsole({
	campaignId,
	closesAt,
	entriesOpen,
	totalEligible,
	lateCount,
	names,
}: Props) {
	const [tab, setTab] = useState<DrawMode>(
		entriesOpen ? "simulation" : "official",
	);
	const [seed, setSeed] = useState("");
	const [excludedPhones, setExcludedPhones] = useState("");
	const [criterion, setCriterion] = useState<DrawCriterion>("simples");
	const [spinningName, setSpinningName] = useState<string | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [result, setResult] = useState<Result | null>(null);
	const [simulations, setSimulations] = useState<string[]>([]);
	const [presenting, setPresenting] = useState(false);

	const seedId = useId();
	const excludedId = useId();

	const closesAtLabel = dateFormatter.format(new Date(closesAt));

	/**
	 * Sair da tela cheia pelo Esc é o reflexo de quem apresenta, e o navegador só
	 * avisa pelo `fullscreenchange` — sem ouvir os dois, a sobreposição ficaria
	 * presa na tela depois que o modo tela cheia do navegador já saiu.
	 */
	useEffect(() => {
		if (!presenting) {
			return;
		}

		function handleKey(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setPresenting(false);
			}
		}

		function handleFullscreenChange() {
			if (document.fullscreenElement === null) {
				setPresenting(false);
			}
		}

		document.addEventListener("keydown", handleKey);
		document.addEventListener("fullscreenchange", handleFullscreenChange);

		return () => {
			document.removeEventListener("keydown", handleKey);
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
		};
	}, [presenting]);

	async function openPresentation() {
		setPresenting(true);

		try {
			await document.documentElement.requestFullscreen();
		} catch {
			// Sem permissão de tela cheia a sobreposição já resolve: ela cobre a
			// janela inteira de qualquer forma.
		}
	}

	function closePresentation() {
		setPresenting(false);

		if (document.fullscreenElement !== null) {
			document.exitFullscreen().catch(() => undefined);
		}
	}

	/**
	 * Gira os nomes enquanto o servidor apura.
	 *
	 * O giro e a requisição correm juntos: a animação é tempo de expectativa, não
	 * tempo de espera somado. Quem pediu menos movimento recebe o resultado direto.
	 */
	async function spinWhile<T>(work: Promise<T>): Promise<T> {
		if (names.length === 0 || prefersReducedMotion()) {
			return work;
		}

		const timer = setInterval(() => {
			setSpinningName(names[Math.floor(Math.random() * names.length)] ?? null);
		}, SPIN_INTERVAL_MS);

		const [value] = await Promise.all([
			work,
			new Promise((resolve) => setTimeout(resolve, SPIN_DURATION_MS)),
		]);

		clearInterval(timer);
		setSpinningName(null);

		return value;
	}

	async function runDraw(mode: DrawMode) {
		// Semente em branco: quem gera é o servidor, e ela fica registrada na ata.
		const input: DrawInput = {
			seed: mode === "simulation" ? "" : seed,
			criterion,
			excludedPhones: mode === "simulation" ? "" : excludedPhones,
			mode,
		};

		setIsDrawing(true);
		setResult(null);

		try {
			const outcome = await spinWhile(drawAction(input));

			if (!outcome.ok) {
				toast.error(outcome.message);
				return;
			}

			setResult({ record: outcome.record, mode });

			if (mode === "simulation") {
				setSimulations((current) => [
					...current,
					outcome.record.ganhador.whatsappE164,
				]);
			}
		} finally {
			setIsDrawing(false);
		}
	}

	const canDraw = !isDrawing;

	return (
		<>
			<main className="mx-auto w-full max-w-4xl px-5 py-10">
				<header className="mb-8 flex flex-wrap items-start justify-between gap-3">
					<div>
						<h1 className="font-bold text-2xl tracking-tight">Sorteio</h1>
						<p className="mt-1 text-muted-foreground text-sm">
							Kit Churrasco — {totalEligible} concorrendo
						</p>
					</div>
					<Button onClick={openPresentation} variant="outline">
						<Maximize2 aria-hidden className="size-4" />
						Tela cheia
					</Button>
				</header>

				<section
					aria-label="Situação da campanha"
					className="mb-8 grid gap-3 sm:grid-cols-3"
				>
					<StatCard
						hint={
							lateCount > 0
								? `${lateCount} fora do prazo, sem concorrer`
								: "Todos dentro do prazo"
						}
						icon={Users}
						label="Concorrendo"
						value={String(totalEligible)}
					/>
					<StatCard
						hint={closesAtLabel}
						icon={entriesOpen ? Timer : ShieldCheck}
						label="Inscrições"
						tone={entriesOpen ? "warning" : "ready"}
						value={entriesOpen ? "Abertas" : "Encerradas"}
					/>
					<StatCard
						hint="Independe de quantos cadastros"
						icon={Dices}
						label="Critério"
						value="1 chance por pessoa"
					/>
				</section>

				<div
					aria-label="Modo de apuração"
					className="mb-6 inline-flex rounded-xl border border-border bg-muted/40 p-1"
					role="tablist"
				>
					<TabButton
						active={tab === "simulation"}
						label="Simulação"
						onClick={() => setTab("simulation")}
					/>
					<TabButton
						active={tab === "official"}
						label="Apuração oficial"
						onClick={() => setTab("official")}
					/>
				</div>

				{tab === "simulation" ? (
					<SimulationPanel
						isDrawing={isDrawing}
						onDraw={() => runDraw("simulation")}
						onPresent={openPresentation}
						simulations={simulations}
					/>
				) : (
					<OfficialPanel
						closesAtLabel={closesAtLabel}
						criterion={criterion}
						entriesOpen={entriesOpen}
						excludedId={excludedId}
						excludedPhones={excludedPhones}
						isDrawing={isDrawing}
						onCriterion={setCriterion}
						onDraw={() => runDraw("official")}
						onExcludedPhones={setExcludedPhones}
						onPresent={openPresentation}
						onSeed={setSeed}
						seed={seed}
						seedId={seedId}
					/>
				)}

				<div aria-live="polite" className="mt-8">
					{isDrawing ? <SpinningCard name={spinningName} /> : null}
					{!isDrawing && result !== null ? (
						<ResultPanel
							onDownload={() => downloadRecord(result.record)}
							onPresent={openPresentation}
							result={result}
						/>
					) : null}
				</div>
			</main>

			{presenting ? (
				<PresentationOverlay
					campaignId={campaignId}
					canDraw={canDraw}
					isDrawing={isDrawing}
					mode={tab}
					onClose={closePresentation}
					onDraw={() => runDraw(tab)}
					result={result}
					spinningName={spinningName}
					totalEligible={totalEligible}
				/>
			) : null}
		</>
	);
}

function StatCard({
	label,
	value,
	hint,
	icon: Icon,
	tone = "neutral",
}: {
	label: string;
	value: string;
	hint: string;
	icon: typeof Users;
	tone?: "neutral" | "warning" | "ready";
}) {
	return (
		<div className="rounded-xl border border-border bg-card px-4 py-4">
			<div className="flex items-center gap-2 text-muted-foreground">
				<Icon aria-hidden className="size-4" />
				<p className="font-medium text-xs uppercase tracking-wide">{label}</p>
			</div>
			<p
				className={cn(
					"mt-2 font-bold text-xl tabular-nums",
					tone === "warning" && "text-amber-600",
					tone === "ready" && "text-emerald-600",
				)}
			>
				{value}
			</p>
			<p className="mt-0.5 text-muted-foreground text-xs">{hint}</p>
		</div>
	);
}

function TabButton({
	active,
	label,
	onClick,
}: {
	active: boolean;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			aria-selected={active}
			className={cn(
				"cursor-pointer rounded-lg px-4 py-2 font-medium text-sm transition-colors",
				active
					? "bg-background text-foreground shadow-sm"
					: "text-muted-foreground hover:text-foreground",
			)}
			onClick={onClick}
			role="tab"
			type="button"
		>
			{label}
		</button>
	);
}

function SimulationPanel({
	onDraw,
	onPresent,
	isDrawing,
	simulations,
}: {
	onDraw: () => void;
	onPresent: () => void;
	isDrawing: boolean;
	simulations: string[];
}) {
	const distinct = new Set(simulations).size;

	return (
		<section className="rounded-xl border border-border bg-card p-6">
			<h2 className="font-semibold text-lg">Simular o sorteio</h2>
			<p className="mt-1 max-w-prose text-muted-foreground text-sm">
				Sorteio de verdade, com os participantes reais, mas sem valer como
				apuração — o resultado muda a cada rodada e nada é registrado.
			</p>

			<div className="mt-5 flex flex-wrap gap-2">
				<Button disabled={isDrawing} onClick={onDraw} size="lg">
					{simulations.length === 0 ? (
						<>
							<Dices aria-hidden className="size-4" />
							Rodar simulação
						</>
					) : (
						<>
							<RotateCcw aria-hidden className="size-4" />
							Simular de novo
						</>
					)}
				</Button>
				<PresentButton onClick={onPresent} />
			</div>

			{simulations.length > 0 ? (
				<p className="mt-4 text-muted-foreground text-sm">
					{simulations.length}{" "}
					{simulations.length === 1 ? "simulação" : "simulações"} · {distinct}{" "}
					{distinct === 1 ? "ganhador diferente" : "ganhadores diferentes"}
				</p>
			) : null}
		</section>
	);
}

function OfficialPanel({
	seed,
	seedId,
	onSeed,
	excludedPhones,
	excludedId,
	onExcludedPhones,
	criterion,
	onCriterion,
	entriesOpen,
	closesAtLabel,
	isDrawing,
	onDraw,
	onPresent,
}: {
	seed: string;
	seedId: string;
	onSeed: (value: string) => void;
	excludedPhones: string;
	excludedId: string;
	onExcludedPhones: (value: string) => void;
	criterion: DrawCriterion;
	onCriterion: (value: DrawCriterion) => void;
	entriesOpen: boolean;
	closesAtLabel: string;
	isDrawing: boolean;
	onDraw: () => void;
	onPresent: () => void;
}) {
	return (
		<section className="rounded-xl border border-border bg-card p-6">
			<h2 className="font-semibold text-lg">Apuração oficial</h2>
			<p className="mt-1 max-w-prose text-muted-foreground text-sm">
				Sorteia e gera a ata do resultado — o documento que permite conferir
				depois quem ganhou e por quê.
			</p>

			{entriesOpen ? (
				<p className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
					<Timer aria-hidden className="mt-0.5 size-4 shrink-0" />
					<span>
						As inscrições vão até <strong>{closesAtLabel}</strong>. Apurando
						agora, quem se cadastrar até lá fica de fora.
					</span>
				</p>
			) : null}

			<div className="mt-5 grid gap-5">
				<details className="rounded-lg border border-border px-4 py-3">
					<summary className="cursor-pointer font-medium text-sm">
						Mais opções
					</summary>

					<div className="mt-4 grid gap-5">
						<div>
							<label className="font-medium text-sm" htmlFor={seedId}>
								Semente pública
							</label>
							<input
								className={cn(fieldClassName, "mt-1.5")}
								id={seedId}
								onChange={(event) => onSeed(event.target.value)}
								placeholder="LF-5987-31/08/2026-12345"
								value={seed}
							/>
							{/*
							 * Opcional de propósito. Em branco, o servidor gera a semente e
							 * registra na ata — o resultado continua reproduzível. Preencher
							 * só vale a pena com um valor público definido depois do fim das
							 * inscrições (Loteria Federal), que é o que prova a terceiros que
							 * ninguém escolheu a semente que dava o ganhador desejado.
							 */}
							<p className="mt-1.5 text-muted-foreground text-xs">
								Deixe em branco que o sistema gera. Preencha só se for usar um
								valor público, como a Loteria Federal do dia.
							</p>
						</div>

						<div>
							<label className="font-medium text-sm" htmlFor={excludedId}>
								Desclassificados
							</label>
							<textarea
								className={cn(fieldClassName, "mt-1.5 min-h-20 resize-y")}
								id={excludedId}
								onChange={(event) => onExcludedPhones(event.target.value)}
								placeholder="(86) 98897-0955, (86) 99999-0000"
								value={excludedPhones}
							/>
							<p className="mt-1.5 text-muted-foreground text-xs">
								WhatsApp de quem não concorre — cadastro de teste, colaborador
								do grupo (§3) ou desclassificado (§9). Qualquer formato serve.
							</p>
						</div>

						<fieldset>
							<legend className="font-medium text-sm">Critério</legend>
							<div className="mt-2 flex flex-col gap-2">
								<CriterionOption
									checked={criterion === "simples"}
									description="Decisão do cliente: todo mundo com a mesma chance."
									label="1 pessoa = 1 chance"
									onSelect={() => onCriterion("simples")}
								/>
								<CriterionOption
									checked={criterion === "ponderado"}
									description="Cada cadastro vale um bilhete, como diz a cláusula 5 do regulamento."
									label="Ponderado por cadastros"
									onSelect={() => onCriterion("ponderado")}
								/>
							</div>
						</fieldset>
					</div>
				</details>

				<div className="flex flex-wrap gap-2">
					<Button disabled={isDrawing} onClick={onDraw} size="lg">
						<Trophy aria-hidden className="size-4" />
						{isDrawing ? "Apurando…" : "Apurar ganhador"}
					</Button>
					<PresentButton onClick={onPresent} />
				</div>
			</div>
		</section>
	);
}

/**
 * Atalho para a tela cheia ao lado do botão de sortear.
 *
 * O mesmo comando existe no cabeçalho da página, mas some da vista assim que
 * alguém rola até o painel — e a hora de projetar é justamente antes do
 * sorteio, não depois de saber o ganhador.
 */
function PresentButton({ onClick }: { onClick: () => void }) {
	return (
		<Button onClick={onClick} size="lg" variant="outline">
			<Maximize2 aria-hidden className="size-4" />
			Tela cheia
		</Button>
	);
}

function CriterionOption({
	checked,
	label,
	description,
	onSelect,
}: {
	checked: boolean;
	label: string;
	description: string;
	onSelect: () => void;
}) {
	return (
		<label
			className={cn(
				"flex cursor-pointer items-start gap-2.5 rounded-lg border px-4 py-3 text-sm transition-colors",
				checked ? "border-brand bg-brand/5" : "border-border hover:bg-muted/50",
			)}
		>
			<input
				checked={checked}
				className="mt-0.5 size-4 cursor-pointer"
				name="criterio"
				onChange={onSelect}
				type="radio"
			/>
			<span>
				<span className="font-medium">{label}</span>
				<span className="block text-muted-foreground text-xs">
					{description}
				</span>
			</span>
		</label>
	);
}

function SpinningCard({ name }: { name: string | null }) {
	return (
		<section className="rounded-xl border border-brand/30 border-dashed bg-card px-6 py-10 text-center">
			<p className="text-muted-foreground text-sm">Sorteando…</p>
			<p className="mt-2 font-bold text-2xl text-brand">{name ?? "…"}</p>
		</section>
	);
}

function ResultPanel({
	result,
	onDownload,
	onPresent,
}: {
	result: Result;
	onDownload: () => void;
	onPresent: () => void;
}) {
	const { record, mode } = result;
	const isSimulation = mode === "simulation";

	return (
		<section
			className={cn(
				"overflow-hidden rounded-xl border",
				isSimulation ? "border-border border-dashed" : "border-brand",
			)}
		>
			<header
				className={cn(
					"flex items-center gap-2 px-6 py-3 font-medium text-sm",
					isSimulation
						? "bg-muted text-muted-foreground"
						: "bg-brand text-white",
				)}
			>
				{isSimulation ? (
					<>
						<Dices aria-hidden className="size-4" />
						Simulação — não vale como apuração
					</>
				) : (
					<>
						<Trophy aria-hidden className="size-4" />
						Resultado oficial
					</>
				)}
			</header>

			<div className="bg-card px-6 py-6">
				<p className="text-muted-foreground text-xs uppercase tracking-wide">
					Ganhador
				</p>
				<p className="mt-1 font-bold text-2xl tracking-tight">
					{record.ganhador.nome}
				</p>
				<p className="mt-1 text-sm">
					{record.ganhador.whatsapp} · {record.ganhador.loja} (
					{record.ganhador.cidade})
				</p>

				{record.suplentes.length > 0 ? (
					<div className="mt-6">
						<p className="text-muted-foreground text-xs uppercase tracking-wide">
							Suplentes
						</p>
						<ol className="mt-2 divide-y divide-border rounded-lg border border-border">
							{record.suplentes.map((entry, index) => (
								<li
									className="flex flex-wrap items-baseline gap-x-2 px-4 py-2.5 text-sm"
									key={entry.whatsappE164}
								>
									<span className="font-medium text-muted-foreground tabular-nums">
										{index + 1}º
									</span>
									<span className="font-medium">{entry.nome}</span>
									<span className="text-muted-foreground">
										{entry.whatsapp} · {entry.loja}
									</span>
								</li>
							))}
						</ol>
					</div>
				) : null}

				<div className="mt-6 flex flex-wrap gap-2">
					<Button onClick={onPresent} variant="outline">
						<Maximize2 aria-hidden className="size-4" />
						Mostrar em tela cheia
					</Button>
					{isSimulation ? null : (
						<Button onClick={onDownload} variant="outline">
							<Download aria-hidden className="size-4" />
							Baixar ata
						</Button>
					)}
				</div>

				<details className="mt-5 text-sm">
					<summary className="cursor-pointer text-muted-foreground">
						Detalhes da apuração
					</summary>
					<dl className="mt-3 grid gap-3 sm:grid-cols-2">
						<Fact label="Semente" value={record.semente} />
						<Fact label="Critério" value={record.criterio} />
						<Fact
							label="Concorreram"
							value={`${record.totais.elegiveis} pessoas · ${record.totais.bilhetes} bilhetes`}
						/>
						<Fact label="Hash do universo" value={record.hashDoUniverso} />
					</dl>
					<p className="mt-3 text-muted-foreground text-xs">
						{record.comoVerificar}
					</p>
				</details>
			</div>
		</section>
	);
}

function Fact({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<dt className="text-muted-foreground text-xs uppercase tracking-wide">
				{label}
			</dt>
			<dd className="mt-0.5 break-all font-medium">{value}</dd>
		</div>
	);
}

/**
 * Tela cheia para conduzir o sorteio ao vivo.
 *
 * Mostra só o que a plateia precisa ver — nome do ganhador e loja — com o
 * telefone mascarado. O resto (semente, hash, suplentes, ata) fica no painel,
 * atrás desta sobreposição.
 */
function PresentationOverlay({
	campaignId,
	mode,
	result,
	isDrawing,
	spinningName,
	canDraw,
	totalEligible,
	onDraw,
	onClose,
}: {
	campaignId: string;
	mode: DrawMode;
	result: Result | null;
	isDrawing: boolean;
	spinningName: string | null;
	canDraw: boolean;
	totalEligible: number;
	onDraw: () => void;
	onClose: () => void;
}) {
	const isSimulation = mode === "simulation";

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-brand text-white">
			<div className="flex items-start justify-between gap-4 px-6 py-5 sm:px-10">
				<div>
					<p className="font-semibold text-sm uppercase tracking-[0.2em] opacity-80">
						Sorteio Kit Churrasco
					</p>
					<p className="text-sm opacity-70">
						{totalEligible} participantes concorrendo
					</p>
				</div>
				<button
					className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/30 px-3 py-2 font-medium text-sm transition-colors hover:bg-white/10"
					onClick={onClose}
					type="button"
				>
					<X aria-hidden className="size-4" />
					Sair (Esc)
				</button>
			</div>

			<div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
				{isDrawing ? (
					<>
						<p className="text-lg uppercase tracking-[0.3em] opacity-80">
							Sorteando
						</p>
						<p className="mt-4 font-bold text-[clamp(2.5rem,9vw,7rem)] leading-none">
							{spinningName ?? "…"}
						</p>
					</>
				) : null}

				{!isDrawing && result !== null ? (
					<>
						<p className="text-lg uppercase tracking-[0.3em] opacity-80">
							{result.mode === "simulation" ? "Simulação" : "Ganhador"}
						</p>
						<p className="mt-4 font-bold text-[clamp(2.5rem,9vw,7rem)] leading-[1.05]">
							{result.record.ganhador.nome}
						</p>
						<p className="mt-6 text-[clamp(1rem,2.5vw,1.75rem)] opacity-90">
							{result.record.ganhador.loja} · {result.record.ganhador.cidade}
						</p>
						<p className="mt-2 text-[clamp(0.9rem,2vw,1.25rem)] opacity-70">
							{maskPhone(result.record.ganhador.whatsapp)}
						</p>
					</>
				) : null}

				{!isDrawing && result === null ? (
					<>
						<p className="font-bold text-[clamp(2rem,6vw,4.5rem)] leading-tight">
							Tudo pronto para o sorteio
						</p>
						<p className="mt-4 max-w-xl text-[clamp(0.95rem,2vw,1.25rem)] opacity-80">
							{isSimulation
								? "Modo simulação: o resultado não vale como apuração."
								: "Apuração oficial da campanha."}
						</p>
					</>
				) : null}

				<button
					className="mt-10 cursor-pointer rounded-full bg-white px-8 py-4 font-bold text-brand text-lg transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!canDraw || isDrawing}
					onClick={onDraw}
					type="button"
				>
					{/*
					 * Na apuração oficial repetir devolve o mesmo nome — é o efeito da
					 * semente, e ao vivo isso vira demonstração de que o sorteio não é
					 * "até dar certo". O rótulo avisa antes de alguém clicar esperando
					 * outro resultado.
					 */}
					{isDrawing
						? "Sorteando…"
						: result === null
							? "Sortear agora"
							: isSimulation
								? "Sortear de novo"
								: "Repetir (mesmo resultado)"}
				</button>

				{!canDraw && !isDrawing ? (
					<p className="mt-4 text-sm opacity-80">
						Preencha a semente e a confirmação no painel para liberar a
						apuração.
					</p>
				) : null}
			</div>

			<p className="px-6 pb-5 text-center text-xs opacity-60 sm:px-10">
				{campaignId}
			</p>
		</div>
	);
}
