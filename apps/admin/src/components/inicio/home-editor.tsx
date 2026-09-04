"use client";

import { arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
	HeroBannerContent,
	HomeContent,
	MediaItemContent,
} from "@plastlima-app/core/schemas";
import { Badge } from "@plastlima-app/ui/components/badge";
import { Button } from "@plastlima-app/ui/components/button";
import { cn } from "@plastlima-app/ui/lib/utils";
import { Eye, GripVertical, History, Pencil, Plus, Trash2 } from "lucide-react";
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
import { ImageThumb } from "@/components/image-thumb";
import { BannerDialog } from "./banner-dialog";
import { HistoryDrawer } from "./history-drawer";
import { OfferDialog } from "./offer-dialog";
import { SortableList, useStableIds } from "./sortable-list";

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
	const [editingOffer, setEditingOffer] = useState<"new" | number | null>(null);

	const router = useRouter();
	const isFirstRender = useRef(true);

	const bannerId = useStableIds<HeroBannerContent>("banner");
	const offerId = useStableIds<MediaItemContent>("offer");

	// O rascunho não passa por validação ao ser salvo (é o ponto do autosave),
	// então um documento antigo pode chegar aqui sem a lista. Ler por uma variável
	// evita espalhar o `??` por toda a seção.
	const offers = home.offers ?? [];

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

	function submitOffer(offer: MediaItemContent) {
		if (editingOffer === "new") {
			updateHome({ ...home, offers: [...offers, offer] });
			return;
		}

		if (typeof editingOffer === "number") {
			updateHome({
				...home,
				offers: offers.map((current, i) =>
					i === editingOffer ? offer : current,
				),
			});
		}
	}

	function removeOffer(index: number) {
		const removed = offers[index];
		updateHome({ ...home, offers: offers.filter((_, i) => i !== index) });

		toast("Novidade removida.", {
			action: {
				label: "Desfazer",
				onClick: () => {
					setHome((current) => {
						const list = current.offers ?? [];
						return {
							...current,
							offers: [
								...list.slice(0, index),
								removed as MediaItemContent,
								...list.slice(index),
							],
						};
					});
					setDirty(true);
				},
			},
		});
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
						Banners do carrossel e novidades da página inicial.
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
						<SortableList
							ids={home.banners.map(bannerId)}
							onReorder={(from, to) =>
								updateHome({
									...home,
									banners: arrayMove(home.banners, from, to),
								})
							}
						>
							{home.banners.map((banner, index) => (
								<BannerRow
									banner={banner}
									hasIssue={issues.some((issue) =>
										issue.path.startsWith(`banners.${index}.`),
									)}
									id={bannerId(banner)}
									key={bannerId(banner)}
									onEdit={() => setEditing(index)}
									onRemove={() => removeBanner(index)}
								/>
							))}
						</SortableList>
					)}
				</section>

				<section className="mt-10 flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="font-semibold text-lg">Novidades</h2>
							<p className="mt-0.5 text-muted-foreground text-sm">
								Os cards de ofertas e encartes da home. Todos levam ao catálogo.
							</p>
						</div>
						<Button
							onClick={() => setEditingOffer("new")}
							size="sm"
							type="button"
							variant="outline"
						>
							<Plus className="size-4" />
							Nova novidade
						</Button>
					</div>

					{offers.length === 0 ? (
						<p className="rounded-xl border border-dashed px-6 py-12 text-center text-muted-foreground text-sm">
							Nenhuma novidade ainda. Use “Nova novidade” para adicionar a
							primeira.
						</p>
					) : (
						<SortableList
							ids={offers.map(offerId)}
							onReorder={(from, to) =>
								updateHome({ ...home, offers: arrayMove(offers, from, to) })
							}
						>
							{offers.map((offer, index) => (
								<OfferRow
									hasIssue={issues.some((issue) =>
										issue.path.startsWith(`offers.${index}.`),
									)}
									id={offerId(offer)}
									key={offerId(offer)}
									offer={offer}
									onEdit={() => setEditingOffer(index)}
									onRemove={() => removeOffer(index)}
								/>
							))}
						</SortableList>
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

			<OfferDialog
				initial={
					typeof editingOffer === "number"
						? (offers[editingOffer] ?? null)
						: null
				}
				onOpenChange={(open) => {
					if (!open) {
						setEditingOffer(null);
					}
				}}
				onSubmit={submitOffer}
				open={editingOffer !== null}
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
	id,
	banner,
	hasIssue,
	onEdit,
	onRemove,
}: {
	id: string;
	banner: HeroBannerContent;
	hasIssue: boolean;
	onEdit: () => void;
	onRemove: () => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	return (
		<li
			className={cn(
				"flex items-center gap-2 rounded-xl border bg-card p-2.5",
				hasIssue ? "border-destructive/50" : "border-border",
				isDragging && "z-10 shadow-lg",
			)}
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
		>
			<button
				aria-label="Arrastar para reordenar"
				className="flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
				type="button"
				{...attributes}
				{...listeners}
			>
				<GripVertical className="size-4" />
			</button>

			<button
				className="h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-border"
				onClick={onEdit}
				title="Editar banner"
				type="button"
			>
				<ImageThumb className="h-full w-full" src={banner.src} />
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

function OfferRow({
	id,
	offer,
	hasIssue,
	onEdit,
	onRemove,
}: {
	id: string;
	offer: MediaItemContent;
	hasIssue: boolean;
	onEdit: () => void;
	onRemove: () => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	return (
		<li
			className={cn(
				"flex items-center gap-2 rounded-xl border bg-card p-2.5",
				hasIssue ? "border-destructive/50" : "border-border",
				isDragging && "z-10 shadow-lg",
			)}
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
		>
			<button
				aria-label="Arrastar para reordenar"
				className="flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
				type="button"
				{...attributes}
				{...listeners}
			>
				<GripVertical className="size-4" />
			</button>

			{/* Miniatura quadrada: é assim que o card sai no site. */}
			<button
				className="size-14 shrink-0 overflow-hidden rounded-lg border border-border"
				onClick={onEdit}
				title="Editar novidade"
				type="button"
			>
				<ImageThumb className="h-full w-full" src={offer.src} />
			</button>

			<div className="min-w-0 flex-1">
				<p
					className={cn(
						"truncate font-medium text-sm",
						offer.alt ? "" : "text-muted-foreground italic",
					)}
				>
					{offer.alt || "(sem texto alternativo)"}
				</p>
				{hasIssue ? (
					<span className="text-destructive text-xs">
						Faltam campos obrigatórios
					</span>
				) : null}
			</div>

			<div className="flex items-center gap-1">
				<Button onClick={onEdit} size="sm" type="button" variant="outline">
					<Pencil className="size-3.5" />
					Editar
				</Button>
				<Button
					aria-label="Remover novidade"
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
