"use client";

import type {
	AboutContent,
	AboutStoryBlock,
} from "@plastlima-app/core/schemas";
import {
	markdownToSegments,
	segmentsToMarkdown,
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
import type { PublishIssue } from "@/app/(painel)/inicio/actions";
import {
	createAboutPreviewUrlAction,
	listAboutRevisionsAction,
	publishAboutAction,
	rollbackAboutAction,
	saveAboutDraftAction,
} from "@/app/(painel)/sobre/actions";
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

let blockCounter = 0;
function nextBlockId(): string {
	blockCounter += 1;
	return `block-${blockCounter}`;
}

type Props = {
	initialAbout: AboutContent;
	initialUpdatedAt: string | null;
	initialStateLabel: string;
	initialCanPublish: boolean;
};

export function AboutEditor({
	initialAbout,
	initialUpdatedAt,
	initialStateLabel,
	initialCanPublish,
}: Props) {
	const [about, setAbout] = useState<AboutContent>(initialAbout);
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
				const result = await saveAboutDraftAction(about);
				setSavedAt(new Date(result.savedAt));
				setStatus("saved");
			} catch {
				setStatus("error");
			}
		}, AUTOSAVE_DELAY_MS);

		return () => clearTimeout(timer);
	}, [about]);

	function update(next: AboutContent) {
		setAbout(next);
		setDirty(true);
	}

	function updateBlock(index: number, block: AboutStoryBlock) {
		update({
			...about,
			story: about.story.map((current, i) => (i === index ? block : current)),
		});
	}

	function addParagraph() {
		update({
			...about,
			story: [
				...about.story,
				{ id: nextBlockId(), kind: "paragraph", segments: [""] },
			],
		});
	}

	function addImage() {
		update({
			...about,
			story: [
				...about.story,
				{ id: nextBlockId(), kind: "image", src: "", alt: "" },
			],
		});
	}

	function removeBlock(index: number) {
		update({ ...about, story: about.story.filter((_, i) => i !== index) });
	}

	function moveBlock(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= about.story.length) {
			return;
		}
		const story = [...about.story];
		const [moved] = story.splice(index, 1);
		if (moved !== undefined) {
			story.splice(target, 0, moved);
		}
		update({ ...about, story });
	}

	async function handlePublish() {
		setIsPublishing(true);
		setIssues([]);

		try {
			await saveAboutDraftAction(about);
			setSavedAt(new Date());
			setStatus("saved");

			const result = await publishAboutAction();

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
			await saveAboutDraftAction(about);
			setSavedAt(new Date());
			setStatus("saved");
		} catch {
			setStatus("error");
		}

		const url = await createAboutPreviewUrlAction();

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
				listAction={listAboutRevisionsAction}
				onClose={() => setHistoryOpen(false)}
				onRestored={() => router.refresh()}
				open={historyOpen}
				rollbackAction={rollbackAboutAction}
			/>

			<div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-8">
				<header>
					<h1 className="font-bold text-2xl tracking-tight">Sobre</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						A história da empresa, o resumo e a mensagem de boas-vindas. Use{" "}
						<code className="rounded bg-muted px-1">**negrito**</code> para
						destacar trechos.
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

				<section className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<h2 className="font-semibold text-lg">História</h2>
						<div className="flex items-center gap-2">
							<Button
								onClick={addParagraph}
								size="sm"
								type="button"
								variant="outline"
							>
								<Plus className="size-4" />
								Parágrafo
							</Button>
							<Button
								onClick={addImage}
								size="sm"
								type="button"
								variant="outline"
							>
								<ImagePlus className="size-4" />
								Imagem
							</Button>
						</div>
					</div>

					{about.story.map((block, index) => (
						<BlockCard
							block={block}
							canMoveDown={index < about.story.length - 1}
							canMoveUp={index > 0}
							issueFor={(field) =>
								issues.find((issue) => issue.path === `story.${index}.${field}`)
									?.message
							}
							key={block.id}
							onChange={(next) => updateBlock(index, next)}
							onMoveDown={() => moveBlock(index, 1)}
							onMoveUp={() => moveBlock(index, -1)}
							onRemove={() => removeBlock(index)}
							position={index}
						/>
					))}
				</section>

				<section className="flex flex-col gap-4">
					<h2 className="font-semibold text-lg">Resumo e boas-vindas</h2>
					<Field
						error={issues.find((i) => i.path === "summary")?.message}
						label="Resumo (aparece na home)"
					>
						<textarea
							className={cn(fieldClassName, "min-h-28 resize-y")}
							onChange={(event) =>
								update({ ...about, summary: event.target.value })
							}
							value={about.summary}
						/>
					</Field>
					<Field
						error={issues.find((i) => i.path === "welcome")?.message}
						label="Mensagem de boas-vindas"
					>
						<textarea
							className={cn(fieldClassName, "min-h-20 resize-y")}
							onChange={(event) =>
								update({ ...about, welcome: event.target.value })
							}
							value={about.welcome}
						/>
					</Field>
				</section>
			</div>
		</div>
	);
}

function BlockCard({
	block,
	position,
	canMoveUp,
	canMoveDown,
	issueFor,
	onChange,
	onMoveUp,
	onMoveDown,
	onRemove,
}: {
	block: AboutStoryBlock;
	position: number;
	canMoveUp: boolean;
	canMoveDown: boolean;
	issueFor: (field: string) => string | undefined;
	onChange: (block: AboutStoryBlock) => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onRemove: () => void;
}) {
	return (
		<article className="rounded-xl border border-border bg-card p-4">
			<div className="mb-3 flex items-center justify-between">
				<span className="font-medium text-muted-foreground text-sm">
					{block.kind === "image" ? "Imagem" : "Parágrafo"} {position + 1}
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
						aria-label="Remover bloco"
						onClick={onRemove}
						size="icon"
						type="button"
						variant="ghost"
					>
						<Trash2 className="size-4 text-destructive" />
					</Button>
				</div>
			</div>

			{block.kind === "image" ? (
				<div className="flex flex-col gap-3">
					<Field error={issueFor("alt")} label="Texto alternativo">
						<input
							className={fieldClassName}
							onChange={(event) =>
								onChange({ ...block, alt: event.target.value })
							}
							value={block.alt}
						/>
					</Field>
					<MediaField
						alt={block.alt}
						error={issueFor("src")}
						label="Imagem"
						onChange={(src) => onChange({ ...block, src })}
						value={block.src}
					/>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					<Field error={issueFor("segments")} label="Texto (use **negrito**)">
						<textarea
							className={cn(fieldClassName, "min-h-28 resize-y")}
							onChange={(event) =>
								onChange({
									...block,
									segments: markdownToSegments(event.target.value),
								})
							}
							value={segmentsToMarkdown(block.segments)}
						/>
					</Field>
					<label className="flex w-fit items-center gap-2 text-sm">
						<input
							checked={block.tone === "lead"}
							onChange={(event) =>
								onChange({
									...block,
									tone: event.target.checked ? "lead" : undefined,
								})
							}
							type="checkbox"
						/>
						Parágrafo de destaque (lead)
					</label>
				</div>
			)}
		</article>
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
