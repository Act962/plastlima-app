"use client";

import type {
	FranchiseContent,
	MarketImageContent,
	TimelineEntryContent,
} from "@plastlima-app/core/schemas";
import { Button } from "@plastlima-app/ui/components/button";
import { cn } from "@plastlima-app/ui/lib/utils";
import {
	ArrowDown,
	ArrowUp,
	Eye,
	History,
	ImagePlus,
	Plus,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	createFranchisePreviewUrlAction,
	listFranchiseRevisionsAction,
	publishFranchiseAction,
	rollbackFranchiseAction,
	saveFranchiseDraftAction,
} from "@/app/(painel)/franquias/actions";
import type { PublishIssue } from "@/app/(painel)/inicio/actions";
import { HistoryDrawer } from "@/components/inicio/history-drawer";
import { MediaField } from "@/components/midia/media-field";

const AUTOSAVE_DELAY_MS = 1500;

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
	hour: "2-digit",
	minute: "2-digit",
	timeZone: "America/Fortaleza",
});

const fieldClassName =
	"w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring";

type SaveStatus = "idle" | "saving" | "saved" | "error";

function move<T>(list: T[], index: number, direction: -1 | 1): T[] {
	const target = index + direction;
	if (target < 0 || target >= list.length) {
		return list;
	}
	const next = [...list];
	const [moved] = next.splice(index, 1);
	if (moved !== undefined) {
		next.splice(target, 0, moved);
	}
	return next;
}

type Props = {
	initialFranchise: FranchiseContent;
	initialUpdatedAt: string | null;
	initialStateLabel: string;
	initialCanPublish: boolean;
};

export function FranchiseEditor({
	initialFranchise,
	initialUpdatedAt,
	initialStateLabel,
	initialCanPublish,
}: Props) {
	const [franchise, setFranchise] =
		useState<FranchiseContent>(initialFranchise);
	const [savedAt, setSavedAt] = useState<Date | null>(
		initialUpdatedAt ? new Date(initialUpdatedAt) : null,
	);
	const [status, setStatus] = useState<SaveStatus>("idle");
	const [dirty, setDirty] = useState(initialCanPublish);
	const [stateLabel, setStateLabel] = useState(initialStateLabel);
	const [isPublishing, setIsPublishing] = useState(false);
	const [issues, setIssues] = useState<PublishIssue[]>([]);
	const [historyOpen, setHistoryOpen] = useState(false);

	const router = useRouter();
	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}

		setStatus("saving");
		const timer = setTimeout(async () => {
			try {
				const result = await saveFranchiseDraftAction(franchise);
				setSavedAt(new Date(result.savedAt));
				setStatus("saved");
			} catch {
				setStatus("error");
			}
		}, AUTOSAVE_DELAY_MS);

		return () => clearTimeout(timer);
	}, [franchise]);

	function update(next: Partial<FranchiseContent>) {
		setFranchise((current) => ({ ...current, ...next }));
		setDirty(true);
	}

	function issueFor(path: string) {
		return issues.find((issue) => issue.path === path)?.message;
	}

	async function handlePublish() {
		setIsPublishing(true);
		setIssues([]);

		try {
			await saveFranchiseDraftAction(franchise);
			setSavedAt(new Date());
			setStatus("saved");

			const result = await publishFranchiseAction();

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
		try {
			await saveFranchiseDraftAction(franchise);
			setSavedAt(new Date());
			setStatus("saved");
		} catch {
			setStatus("error");
		}

		const url = await createFranchisePreviewUrlAction();

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
					<Button
						onClick={handlePreview}
						size="sm"
						type="button"
						variant="outline"
					>
						<Eye className="size-4" />
						Visualizar
					</Button>
					<Button
						onClick={() => setHistoryOpen(true)}
						size="sm"
						type="button"
						variant="outline"
					>
						<History className="size-4" />
						Histórico
					</Button>
					<Button
						disabled={!dirty || isPublishing}
						onClick={handlePublish}
						size="sm"
						type="button"
					>
						{isPublishing ? "Publicando…" : "Publicar"}
					</Button>
				</div>
			</div>

			<HistoryDrawer
				listAction={listFranchiseRevisionsAction}
				onClose={() => setHistoryOpen(false)}
				onRestored={() => router.refresh()}
				open={historyOpen}
				rollbackAction={rollbackFranchiseAction}
			/>

			<div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-8">
				<header>
					<h1 className="font-bold text-2xl tracking-tight">Franquias</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						A trajetória, o texto "Sobre a Plastlima", os segmentos atendidos e
						as imagens de dados de mercado da página "Seja um franqueado".
					</p>
				</header>

				{issues.length > 0 ? (
					<div
						className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3"
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

				<TimelineSection
					entries={franchise.timeline}
					issueFor={issueFor}
					onChange={(timeline) => update({ timeline })}
				/>

				<AboutSection
					issueFor={issueFor}
					onChange={(about) => update({ about })}
					paragraphs={franchise.about}
				/>

				<SegmentsSection
					issueFor={issueFor}
					onChange={(segments) => update({ segments })}
					segments={franchise.segments}
				/>

				<MarketImagesSection
					images={franchise.marketImages}
					issueFor={issueFor}
					onChange={(marketImages) => update({ marketImages })}
				/>
			</div>
		</div>
	);
}

function TimelineSection({
	entries,
	issueFor,
	onChange,
}: {
	entries: TimelineEntryContent[];
	issueFor: (path: string) => string | undefined;
	onChange: (entries: TimelineEntryContent[]) => void;
}) {
	function updateEntry(index: number, entry: TimelineEntryContent) {
		onChange(entries.map((current, i) => (i === index ? entry : current)));
	}

	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-lg">Trajetória</h2>
				<Button
					onClick={() => onChange([...entries, { year: "", description: "" }])}
					size="sm"
					type="button"
					variant="outline"
				>
					<Plus className="size-4" />
					Marco
				</Button>
			</div>

			{entries.map((entry, index) => (
				<article
					className="rounded-xl border border-border bg-card p-4"
					key={index}
				>
					<div className="mb-3 flex items-center justify-between">
						<span className="font-medium text-muted-foreground text-sm">
							Marco {index + 1}
						</span>
						<RowControls
							canMoveDown={index < entries.length - 1}
							canMoveUp={index > 0}
							onMoveDown={() => onChange(move(entries, index, 1))}
							onMoveUp={() => onChange(move(entries, index, -1))}
							onRemove={() => onChange(entries.filter((_, i) => i !== index))}
							removeLabel="Remover marco"
						/>
					</div>
					<div className="flex flex-col gap-3">
						<Field error={issueFor(`timeline.${index}.year`)} label="Ano">
							<input
								className={fieldClassName}
								onChange={(event) =>
									updateEntry(index, { ...entry, year: event.target.value })
								}
								value={entry.year}
							/>
						</Field>
						<Field
							error={issueFor(`timeline.${index}.description`)}
							label="Descrição"
						>
							<textarea
								className={cn(fieldClassName, "min-h-20 resize-y")}
								onChange={(event) =>
									updateEntry(index, {
										...entry,
										description: event.target.value,
									})
								}
								value={entry.description}
							/>
						</Field>
					</div>
				</article>
			))}
		</section>
	);
}

function AboutSection({
	paragraphs,
	issueFor,
	onChange,
}: {
	paragraphs: string[];
	issueFor: (path: string) => string | undefined;
	onChange: (paragraphs: string[]) => void;
}) {
	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-lg">Sobre a Plastlima</h2>
				<Button
					onClick={() => onChange([...paragraphs, ""])}
					size="sm"
					type="button"
					variant="outline"
				>
					<Plus className="size-4" />
					Parágrafo
				</Button>
			</div>

			{paragraphs.map((paragraph, index) => (
				<article
					className="rounded-xl border border-border bg-card p-4"
					key={index}
				>
					<div className="mb-3 flex items-center justify-between">
						<span className="font-medium text-muted-foreground text-sm">
							Parágrafo {index + 1}
						</span>
						<RowControls
							canMoveDown={index < paragraphs.length - 1}
							canMoveUp={index > 0}
							onMoveDown={() => onChange(move(paragraphs, index, 1))}
							onMoveUp={() => onChange(move(paragraphs, index, -1))}
							onRemove={() =>
								onChange(paragraphs.filter((_, i) => i !== index))
							}
							removeLabel="Remover parágrafo"
						/>
					</div>
					<Field error={issueFor(`about.${index}`)} label="Texto">
						<textarea
							className={cn(fieldClassName, "min-h-24 resize-y")}
							onChange={(event) =>
								onChange(
									paragraphs.map((current, i) =>
										i === index ? event.target.value : current,
									),
								)
							}
							value={paragraph}
						/>
					</Field>
				</article>
			))}
		</section>
	);
}

function SegmentsSection({
	segments,
	issueFor,
	onChange,
}: {
	segments: string[];
	issueFor: (path: string) => string | undefined;
	onChange: (segments: string[]) => void;
}) {
	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-lg">Segmentos atendidos</h2>
				<Button
					onClick={() => onChange([...segments, ""])}
					size="sm"
					type="button"
					variant="outline"
				>
					<Plus className="size-4" />
					Segmento
				</Button>
			</div>

			<div className="flex flex-col gap-2">
				{segments.map((segment, index) => (
					<div className="flex flex-col gap-1" key={index}>
						<div className="flex items-center gap-2">
							<input
								aria-label={`Segmento ${index + 1}`}
								className={cn(fieldClassName, "flex-1")}
								onChange={(event) =>
									onChange(
										segments.map((current, i) =>
											i === index ? event.target.value : current,
										),
									)
								}
								value={segment}
							/>
							<Button
								aria-label="Remover segmento"
								onClick={() => onChange(segments.filter((_, i) => i !== index))}
								size="icon"
								type="button"
								variant="ghost"
							>
								<Trash2 className="size-4 text-destructive" />
							</Button>
						</div>
						{issueFor(`segments.${index}`) ? (
							<span className="text-destructive text-xs">
								{issueFor(`segments.${index}`)}
							</span>
						) : null}
					</div>
				))}
			</div>
		</section>
	);
}

function MarketImagesSection({
	images,
	issueFor,
	onChange,
}: {
	images: MarketImageContent[];
	issueFor: (path: string) => string | undefined;
	onChange: (images: MarketImageContent[]) => void;
}) {
	function updateImage(index: number, image: MarketImageContent) {
		onChange(images.map((current, i) => (i === index ? image : current)));
	}

	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-lg">Imagens de mercado</h2>
				<Button
					onClick={() => onChange([...images, { src: "", alt: "" }])}
					size="sm"
					type="button"
					variant="outline"
				>
					<ImagePlus className="size-4" />
					Imagem
				</Button>
			</div>

			{images.map((image, index) => (
				<article
					className="rounded-xl border border-border bg-card p-4"
					key={index}
				>
					<div className="mb-3 flex items-center justify-between">
						<span className="font-medium text-muted-foreground text-sm">
							Imagem {index + 1}
						</span>
						<Button
							aria-label="Remover imagem"
							onClick={() => onChange(images.filter((_, i) => i !== index))}
							size="icon"
							type="button"
							variant="ghost"
						>
							<Trash2 className="size-4 text-destructive" />
						</Button>
					</div>
					<div className="flex flex-col gap-3">
						<Field
							error={issueFor(`marketImages.${index}.alt`)}
							label="Texto alternativo"
						>
							<input
								className={fieldClassName}
								onChange={(event) =>
									updateImage(index, { ...image, alt: event.target.value })
								}
								value={image.alt}
							/>
						</Field>
						<MediaField
							alt={image.alt}
							error={issueFor(`marketImages.${index}.src`)}
							label="Imagem"
							onChange={(src) => updateImage(index, { ...image, src })}
							value={image.src}
						/>
					</div>
				</article>
			))}
		</section>
	);
}

function RowControls({
	canMoveUp,
	canMoveDown,
	onMoveUp,
	onMoveDown,
	onRemove,
	removeLabel,
}: {
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onRemove: () => void;
	removeLabel: string;
}) {
	return (
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
				aria-label={removeLabel}
				onClick={onRemove}
				size="icon"
				type="button"
				variant="ghost"
			>
				<Trash2 className="size-4 text-destructive" />
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
		// biome-ignore lint/a11y/noLabelWithoutControl: o control é passado via children.
		<label className="flex flex-col gap-1.5">
			<span className="font-medium text-sm">{label}</span>
			{children}
			{error ? <span className="text-destructive text-xs">{error}</span> : null}
		</label>
	);
}
