"use client";

import type {
	HeroBannerContent,
	HomeContent,
} from "@plastlima-app/core/schemas";
import { Badge } from "@plastlima-app/ui/components/badge";
import { Button } from "@plastlima-app/ui/components/button";
import { cn } from "@plastlima-app/ui/lib/utils";
import {
	ArrowDown,
	ArrowUp,
	Eye,
	History,
	ImageOff,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	createHomePreviewUrlAction,
	listHomeRevisionsAction,
	type PublishIssue,
	publishHomeAction,
	rollbackHomeAction,
	saveHomeDraftAction,
} from "@/app/(painel)/inicio/actions";
import { BannerDialog } from "./banner-dialog";
import { HistoryDrawer } from "./history-drawer";

const AUTOSAVE_DELAY_MS = 1500;

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
	hour: "2-digit",
	minute: "2-digit",
	timeZone: "America/Fortaleza",
});

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
	const [historyOpen, setHistoryOpen] = useState(false);

	// `null` = diálogo fechado; `"new"` = criando; número = editando aquele índice.
	const [editing, setEditing] = useState<"new" | number | null>(null);

	const router = useRouter();
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

	function submitBanner(banner: HeroBannerContent) {
		if (editing === "new") {
			updateHome({ ...home, banners: [...home.banners, banner] });
			return;
		}

		if (typeof editing === "number") {
			updateHome({
				...home,
				banners: home.banners.map((current, i) =>
					i === editing ? banner : current,
				),
			});
		}
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
							removed as HeroBannerContent,
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

	async function handlePreview() {
		// Salva o rascunho antes: o preview lê o rascunho do banco, então precisa
		// refletir o que está na tela agora.
		try {
			await saveHomeDraftAction(home);
			setSavedAt(new Date());
			setStatus("saved");
		} catch {
			setStatus("error");
		}

		const url = await createHomePreviewUrlAction();

		if (url === null) {
			toast.error(
				"Pré-visualização indisponível: configure PREVIEW_SECRET e PUBLIC_SITE_URL.",
			);
			return;
		}

		window.open(url, "_blank", "noopener,noreferrer");
	}

	return (
		<div className="flex flex-col">
			<StatusBar
				dirty={dirty}
				isPublishing={isPublishing}
				onOpenHistory={() => setHistoryOpen(true)}
				onPreview={handlePreview}
				onPublish={handlePublish}
				savedAt={savedAt}
				stateLabel={stateLabel}
				status={status}
			/>

			<HistoryDrawer
				listAction={listHomeRevisionsAction}
				onClose={() => setHistoryOpen(false)}
				onRestored={() => router.refresh()}
				open={historyOpen}
				rollbackAction={rollbackHomeAction}
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
							onClick={() => setEditing("new")}
							size="sm"
							type="button"
							variant="outline"
						>
							<Plus className="size-4" />
							Novo banner
						</Button>
					</div>

					{home.banners.length === 0 ? (
						<p className="rounded-xl border border-dashed px-6 py-12 text-center text-muted-foreground text-sm">
							Nenhum banner ainda. Use “Novo banner” para adicionar o primeiro.
						</p>
					) : (
						<ul className="flex flex-col gap-2.5">
							{home.banners.map((banner, index) => (
								<BannerRow
									banner={banner}
									canMoveDown={index < home.banners.length - 1}
									canMoveUp={index > 0}
									hasIssue={issues.some((issue) =>
										issue.path.startsWith(`banners.${index}.`),
									)}
									key={index}
									onEdit={() => setEditing(index)}
									onMoveDown={() => moveBanner(index, 1)}
									onMoveUp={() => moveBanner(index, -1)}
									onRemove={() => removeBanner(index)}
								/>
							))}
						</ul>
					)}
				</section>
			</div>

			<BannerDialog
				initial={
					typeof editing === "number" ? (home.banners[editing] ?? null) : null
				}
				onOpenChange={(open) => {
					if (!open) {
						setEditing(null);
					}
				}}
				onSubmit={submitBanner}
				open={editing !== null}
			/>
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
	onOpenHistory,
	onPreview,
}: {
	status: SaveStatus;
	savedAt: Date | null;
	stateLabel: string;
	dirty: boolean;
	isPublishing: boolean;
	onPublish: () => void;
	onOpenHistory: () => void;
	onPreview: () => void;
}) {
	return (
		<div className="sticky top-12 z-10 flex flex-wrap items-center justify-between gap-3 border-border border-b bg-card/80 px-6 py-3 backdrop-blur">
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

			<div className="flex items-center gap-2">
				<Button onClick={onPreview} size="sm" type="button" variant="outline">
					<Eye className="size-4" />
					Visualizar
				</Button>
				<Button
					onClick={onOpenHistory}
					size="sm"
					type="button"
					variant="outline"
				>
					<History className="size-4" />
					Histórico
				</Button>
				<Button
					disabled={!dirty || isPublishing}
					onClick={onPublish}
					size="sm"
					type="button"
				>
					{isPublishing ? "Publicando…" : "Publicar"}
				</Button>
			</div>
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

function BannerRow({
	banner,
	hasIssue,
	canMoveUp,
	canMoveDown,
	onEdit,
	onMoveUp,
	onMoveDown,
	onRemove,
}: {
	banner: HeroBannerContent;
	hasIssue: boolean;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onEdit: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onRemove: () => void;
}) {
	return (
		<li
			className={cn(
				"flex items-center gap-3 rounded-xl border bg-card p-2.5",
				hasIssue ? "border-destructive/50" : "border-border",
			)}
		>
			<button
				className="flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40"
				onClick={onEdit}
				title="Editar banner"
				type="button"
			>
				{banner.src ? (
					// biome-ignore lint/performance/noImgElement: preview do painel a partir de URL/caminho arbitrário.
					<img alt="" className="h-full w-full object-cover" src={banner.src} />
				) : (
					<ImageOff className="size-5 text-muted-foreground" />
				)}
			</button>

			<div className="min-w-0 flex-1">
				<p
					className={cn(
						"truncate font-medium text-sm",
						banner.alt ? "" : "text-muted-foreground italic",
					)}
				>
					{banner.alt || "(sem texto alternativo)"}
				</p>
				<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
					{banner.mobile ? (
						<Badge variant="default">Mobile ✓</Badge>
					) : (
						<Badge variant="secondary">Sem mobile</Badge>
					)}
					{banner.aspect ? (
						<Badge variant="outline">Proporção {banner.aspect}</Badge>
					) : null}
					{banner.href ? <Badge variant="outline">Link</Badge> : null}
					{hasIssue ? (
						<span className="text-destructive text-xs">
							Faltam campos obrigatórios
						</span>
					) : null}
				</div>
			</div>

			<div className="flex items-center gap-1">
				<Button onClick={onEdit} size="sm" type="button" variant="outline">
					<Pencil className="size-3.5" />
					Editar
				</Button>
				<Button
					aria-label="Mover para cima"
					disabled={!canMoveUp}
					onClick={onMoveUp}
					size="icon-sm"
					type="button"
					variant="ghost"
				>
					<ArrowUp className="size-4" />
				</Button>
				<Button
					aria-label="Mover para baixo"
					disabled={!canMoveDown}
					onClick={onMoveDown}
					size="icon-sm"
					type="button"
					variant="ghost"
				>
					<ArrowDown className="size-4" />
				</Button>
				<Button
					aria-label="Remover banner"
					onClick={onRemove}
					size="icon-sm"
					type="button"
					variant="ghost"
				>
					<Trash2 className="size-4 text-destructive" />
				</Button>
			</div>
		</li>
	);
}
