"use client";

import type {
	NavigationContent,
	NavLinkContent,
} from "@plastlima-app/core/schemas";
import { Button } from "@plastlima-app/ui/components/button";
import { cn } from "@plastlima-app/ui/lib/utils";
import { Eye, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { PublishIssue } from "@/app/(painel)/inicio/actions";
import {
	createNavigationPreviewUrlAction,
	listNavigationRevisionsAction,
	publishNavigationAction,
	rollbackNavigationAction,
	saveNavigationDraftAction,
} from "@/app/(painel)/navegacao/actions";
import { HistoryDrawer } from "@/components/inicio/history-drawer";

const AUTOSAVE_DELAY_MS = 1500;

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
	hour: "2-digit",
	minute: "2-digit",
	timeZone: "America/Fortaleza",
});

const fieldClassName =
	"w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type Section = "main" | "legal";

type Props = {
	initialNavigation: NavigationContent;
	initialUpdatedAt: string | null;
	initialStateLabel: string;
	initialCanPublish: boolean;
};

export function NavigationEditor({
	initialNavigation,
	initialUpdatedAt,
	initialStateLabel,
	initialCanPublish,
}: Props) {
	const [navigation, setNavigation] =
		useState<NavigationContent>(initialNavigation);
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
				const result = await saveNavigationDraftAction(navigation);
				setSavedAt(new Date(result.savedAt));
				setStatus("saved");
			} catch {
				setStatus("error");
			}
		}, AUTOSAVE_DELAY_MS);

		return () => clearTimeout(timer);
	}, [navigation]);

	function updateLabel(section: Section, index: number, label: string) {
		setNavigation((current) => ({
			...current,
			[section]: current[section].map((item, i) =>
				i === index ? { ...item, label } : item,
			),
		}));
		setDirty(true);
	}

	async function handlePublish() {
		setIsPublishing(true);
		setIssues([]);

		try {
			await saveNavigationDraftAction(navigation);
			setSavedAt(new Date());
			setStatus("saved");

			const result = await publishNavigationAction();

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
			await saveNavigationDraftAction(navigation);
			setSavedAt(new Date());
			setStatus("saved");
		} catch {
			setStatus("error");
		}

		const url = await createNavigationPreviewUrlAction();

		if (url === null) {
			toast.error(
				"Pré-visualização indisponível: configure PREVIEW_SECRET e PUBLIC_SITE_URL.",
			);
			return;
		}

		window.open(url, "_blank", "noopener,noreferrer");
	}

	function issueFor(section: Section, index: number) {
		return issues.find((issue) => issue.path === `${section}.${index}.label`)
			?.message;
	}

	return (
		<div className="flex flex-col">
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
				listAction={listNavigationRevisionsAction}
				onClose={() => setHistoryOpen(false)}
				onRestored={() => router.refresh()}
				open={historyOpen}
				rollbackAction={rollbackNavigationAction}
			/>

			<div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-8">
				<header>
					<h1 className="font-bold text-2xl tracking-tight">Navegação</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Os rótulos do menu do site. Os destinos (rotas) são fixos e não
						podem ser alterados aqui — só o texto que aparece.
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

				<NavSection
					items={navigation.main}
					issueFor={(index) => issueFor("main", index)}
					onLabelChange={(index, label) => updateLabel("main", index, label)}
					title="Menu principal"
				/>

				<NavSection
					items={navigation.legal}
					issueFor={(index) => issueFor("legal", index)}
					onLabelChange={(index, label) => updateLabel("legal", index, label)}
					title="Rodapé jurídico"
				/>
			</div>
		</div>
	);
}

function NavSection({
	title,
	items,
	issueFor,
	onLabelChange,
}: {
	title: string;
	items: NavLinkContent[];
	issueFor: (index: number) => string | undefined;
	onLabelChange: (index: number, label: string) => void;
}) {
	return (
		<section className="flex flex-col gap-3">
			<h2 className="font-semibold text-lg">{title}</h2>
			{items.map((item, index) => (
				<div
					className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4"
					key={item.href}
				>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<span className="font-medium text-sm">Rótulo</span>
						<code className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
							{item.href}
						</code>
					</div>
					<input
						aria-label={`Rótulo para ${item.href}`}
						className={fieldClassName}
						onChange={(event) => onLabelChange(index, event.target.value)}
						value={item.label}
					/>
					{issueFor(index) ? (
						<span className="text-destructive text-xs">{issueFor(index)}</span>
					) : null}
				</div>
			))}
		</section>
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
