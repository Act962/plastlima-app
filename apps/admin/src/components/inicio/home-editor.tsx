"use client";

import type {
	HeroBannerContent,
	HomeContent,
} from "@plastlima-app/core/schemas";
import { Button } from "@plastlima-app/ui/components/button";
import { cn } from "@plastlima-app/ui/lib/utils";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	type PublishIssue,
	publishHomeAction,
	saveHomeDraftAction,
} from "@/app/(painel)/inicio/actions";

const AUTOSAVE_DELAY_MS = 1500;

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
	hour: "2-digit",
	minute: "2-digit",
	timeZone: "America/Fortaleza",
});

const fieldClassName =
	"w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
	initialHome: HomeContent;
	initialUpdatedAt: string | null;
	initialStateLabel: string;
	initialCanPublish: boolean;
};

export function HomeEditor({
	initialHome,
	initialUpdatedAt,
	initialStateLabel,
	initialCanPublish,
}: Props) {
	const [home, setHome] = useState<HomeContent>(initialHome);
	const [savedAt, setSavedAt] = useState<Date | null>(
		initialUpdatedAt ? new Date(initialUpdatedAt) : null,
	);
	const [status, setStatus] = useState<SaveStatus>("idle");
	const [dirty, setDirty] = useState(initialCanPublish);
	const [stateLabel, setStateLabel] = useState(initialStateLabel);
	const [isPublishing, setIsPublishing] = useState(false);
	const [issues, setIssues] = useState<PublishIssue[]>([]);

	const isFirstRender = useRef(true);

	// Autosave com debounce: nada disso afeta o site até publicar, então salvar é
	// barato e evita a falha nº 1 de painel caseiro — perder trabalho por
	// navegação acidental (spec §6.3).
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}

		setStatus("saving");
		const timer = setTimeout(async () => {
			try {
				const result = await saveHomeDraftAction(home);
				setSavedAt(new Date(result.savedAt));
				setStatus("saved");
			} catch {
				setStatus("error");
			}
		}, AUTOSAVE_DELAY_MS);

		return () => clearTimeout(timer);
	}, [home]);

	function updateHome(next: HomeContent) {
		setHome(next);
		setDirty(true);
	}

	function updateBanner(index: number, patch: Partial<HeroBannerContent>) {
		updateHome({
			...home,
			banners: home.banners.map((banner, i) =>
				i === index ? { ...banner, ...patch } : banner,
			),
		});
	}

	function addBanner() {
		updateHome({
			...home,
			banners: [...home.banners, { src: "", alt: "", aspect: 3 }],
		});
	}

	function removeBanner(index: number) {
		const removed = home.banners[index];
		updateHome({
			...home,
			banners: home.banners.filter((_, i) => i !== index),
		});

		toast("Banner removido.", {
			action: {
				label: "Desfazer",
				onClick: () => {
					setHome((current) => ({
						...current,
						banners: [
							...current.banners.slice(0, index),
							removed,
							...current.banners.slice(index),
						],
					}));
					setDirty(true);
				},
			},
		});
	}

	function moveBanner(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= home.banners.length) {
			return;
		}

		const banners = [...home.banners];
		const [moved] = banners.splice(index, 1);
		banners.splice(target, 0, moved as HeroBannerContent);
		updateHome({ ...home, banners });
	}

	async function handlePublish() {
		setIsPublishing(true);
		setIssues([]);

		try {
			// Garante que o rascunho no banco é o que está na tela antes de publicar,
			// mesmo que o debounce do autosave ainda não tenha disparado.
			await saveHomeDraftAction(home);
			setSavedAt(new Date());
			setStatus("saved");

			const result = await publishHomeAction();

			if (result.ok) {
				toast.success(`Publicado — revisão ${result.version}.`);
				setDirty(false);
				setStateLabel("Publicado");
				return;
			}

			toast.error(result.message);
			if (result.issues) {
				setIssues(result.issues);
			}
		} finally {
			setIsPublishing(false);
		}
	}

	return (
		<div className="flex flex-col">
			<StatusBar
				dirty={dirty}
				isPublishing={isPublishing}
				onPublish={handlePublish}
				savedAt={savedAt}
				stateLabel={stateLabel}
				status={status}
			/>

			<div className="mx-auto w-full max-w-3xl px-6 py-8">
				<header className="mb-6">
					<h1 className="font-bold text-2xl tracking-tight">Início</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Banners do carrossel da página inicial.
					</p>
				</header>

				{issues.length > 0 ? (
					<div
						className="mb-6 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3"
						role="alert"
					>
						<p className="font-semibold text-destructive text-sm">
							Não foi possível publicar:
						</p>
						<ul className="mt-1.5 list-disc pl-5 text-destructive text-sm">
							{issues.map((issue) => (
								<li key={`${issue.path}-${issue.message}`}>{issue.message}</li>
							))}
						</ul>
					</div>
				) : null}

				<section className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<h2 className="font-semibold text-lg">Banners do carrossel</h2>
						<Button
							onClick={addBanner}
							size="sm"
							type="button"
							variant="outline"
						>
							<Plus className="size-4" />
							Novo banner
						</Button>
					</div>

					{home.banners.map((banner, index) => (
						<BannerCard
							banner={banner}
							canMoveDown={index < home.banners.length - 1}
							canMoveUp={index > 0}
							issues={issues}
							// biome-ignore lint/suspicious/noArrayIndexKey: banners não têm id estável; a ordem é a identidade e o índice reflete a posição editada.
							key={index}
							onChange={(patch) => updateBanner(index, patch)}
							onMoveDown={() => moveBanner(index, 1)}
							onMoveUp={() => moveBanner(index, -1)}
							onRemove={() => removeBanner(index)}
							position={index}
						/>
					))}
				</section>
			</div>
		</div>
	);
}

function StatusBar({
	status,
	savedAt,
	stateLabel,
	dirty,
	isPublishing,
	onPublish,
}: {
	status: SaveStatus;
	savedAt: Date | null;
	stateLabel: string;
	dirty: boolean;
	isPublishing: boolean;
	onPublish: () => void;
}) {
	return (
		<div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-border border-b bg-card/80 px-6 py-3 backdrop-blur">
			<div className="flex items-center gap-3">
				<span
					className={cn(
						"rounded-full px-2.5 py-1 font-medium text-xs",
						dirty
							? "bg-yellow-100 text-yellow-800"
							: "bg-emerald-100 text-emerald-800",
					)}
				>
					{stateLabel}
				</span>
				<SaveIndicator savedAt={savedAt} status={status} />
			</div>

			<Button
				disabled={!dirty || isPublishing}
				onClick={onPublish}
				size="sm"
				type="button"
			>
				{isPublishing ? "Publicando…" : "Publicar"}
			</Button>
		</div>
	);
}

function SaveIndicator({
	status,
	savedAt,
}: {
	status: SaveStatus;
	savedAt: Date | null;
}) {
	if (status === "saving") {
		return <span className="text-muted-foreground text-xs">Salvando…</span>;
	}

	if (status === "error") {
		return (
			<span className="text-destructive text-xs">Falha ao salvar rascunho</span>
		);
	}

	if (savedAt === null) {
		return null;
	}

	return (
		<span className="text-muted-foreground text-xs">
			Salvo às {timeFormatter.format(savedAt)}
		</span>
	);
}

function BannerCard({
	banner,
	position,
	issues,
	canMoveUp,
	canMoveDown,
	onChange,
	onMoveUp,
	onMoveDown,
	onRemove,
}: {
	banner: HeroBannerContent;
	position: number;
	issues: PublishIssue[];
	canMoveUp: boolean;
	canMoveDown: boolean;
	onChange: (patch: Partial<HeroBannerContent>) => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onRemove: () => void;
}) {
	const altIssue = issues.find(
		(issue) => issue.path === `banners.${position}.alt`,
	);
	const srcIssue = issues.find(
		(issue) => issue.path === `banners.${position}.src`,
	);

	return (
		<article className="rounded-xl border border-border bg-card p-4">
			<div className="mb-3 flex items-center justify-between">
				<span className="font-medium text-muted-foreground text-sm">
					Banner {position + 1}
				</span>
				<div className="flex items-center gap-1">
					<Button
						aria-label="Mover para cima"
						disabled={!canMoveUp}
						onClick={onMoveUp}
						size="icon"
						type="button"
						variant="ghost"
					>
						<ArrowUp className="size-4" />
					</Button>
					<Button
						aria-label="Mover para baixo"
						disabled={!canMoveDown}
						onClick={onMoveDown}
						size="icon"
						type="button"
						variant="ghost"
					>
						<ArrowDown className="size-4" />
					</Button>
					<Button
						aria-label="Remover banner"
						onClick={onRemove}
						size="icon"
						type="button"
						variant="ghost"
					>
						<Trash2 className="size-4 text-destructive" />
					</Button>
				</div>
			</div>

			<div className="flex flex-col gap-3">
				<Field
					error={altIssue?.message}
					label="Texto alternativo (obrigatório)"
				>
					<textarea
						className={cn(fieldClassName, "min-h-16 resize-y")}
						onChange={(event) => onChange({ alt: event.target.value })}
						placeholder="Descreva a imagem para leitores de tela e SEO"
						value={banner.alt}
					/>
				</Field>

				<Field error={srcIssue?.message} label="Imagem (caminho)">
					<input
						className={fieldClassName}
						onChange={(event) => onChange({ src: event.target.value })}
						placeholder="/banners/exemplo.jpeg"
						type="text"
						value={banner.src}
					/>
				</Field>

				<div className="grid grid-cols-2 gap-3">
					<Field label="Proporção (largura ÷ altura)">
						<input
							className={fieldClassName}
							onChange={(event) =>
								onChange({ aspect: Number(event.target.value) || undefined })
							}
							step="0.01"
							type="number"
							value={banner.aspect ?? ""}
						/>
					</Field>

					<Field label="Link ao clicar (opcional)">
						<input
							className={fieldClassName}
							onChange={(event) =>
								onChange({ href: event.target.value || undefined })
							}
							placeholder="/sorteio"
							type="text"
							value={banner.href ?? ""}
						/>
					</Field>
				</div>
			</div>
		</article>
	);
}

function Field({
	label,
	error,
	children,
}: {
	label: string;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: o control (input/textarea) é passado via children, fora do que o Biome enxerga estaticamente.
		<label className="flex flex-col gap-1.5">
			<span className="font-medium text-sm">{label}</span>
			{children}
			{error ? <span className="text-destructive text-xs">{error}</span> : null}
		</label>
	);
}
