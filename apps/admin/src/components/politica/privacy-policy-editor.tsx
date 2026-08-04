"use client";

import {
	findUnknownPolicyTokens,
	POLICY_TOKENS,
	type PolicyBlockContent,
	type PolicySectionContent,
	type PrivacyPolicyContent,
} from "@plastlima-app/core/schemas";
import { Button } from "@plastlima-app/ui/components/button";
import { cn } from "@plastlima-app/ui/lib/utils";
import {
	ArrowDown,
	ArrowUp,
	Eye,
	History,
	List,
	Plus,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { PublishIssue } from "@/app/(painel)/inicio/actions";
import {
	createPrivacyPolicyPreviewUrlAction,
	listPrivacyPolicyRevisionsAction,
	publishPrivacyPolicyAction,
	rollbackPrivacyPolicyAction,
	savePrivacyPolicyDraftAction,
} from "@/app/(painel)/politica-de-privacidade/actions";
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

let sectionCounter = 0;
function nextSectionId(): string {
	sectionCounter += 1;
	return `secao-${sectionCounter}`;
}

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

/** Todo o texto do documento, para checar tokens desconhecidos. */
function collectText(policy: PrivacyPolicyContent): string[] {
	const texts = [policy.updatedAt, ...policy.intro];
	for (const section of policy.sections) {
		texts.push(section.title);
		for (const block of section.blocks) {
			if (block.type === "paragraph") {
				texts.push(block.text);
			} else {
				if (block.lead) {
					texts.push(block.lead);
				}
				texts.push(...block.items);
			}
		}
	}
	return texts;
}

type Props = {
	initialPolicy: PrivacyPolicyContent;
	initialUpdatedAt: string | null;
	initialStateLabel: string;
	initialCanPublish: boolean;
};

export function PrivacyPolicyEditor({
	initialPolicy,
	initialUpdatedAt,
	initialStateLabel,
	initialCanPublish,
}: Props) {
	const [policy, setPolicy] = useState<PrivacyPolicyContent>(initialPolicy);
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
				const result = await savePrivacyPolicyDraftAction(policy);
				setSavedAt(new Date(result.savedAt));
				setStatus("saved");
			} catch {
				setStatus("error");
			}
		}, AUTOSAVE_DELAY_MS);

		return () => clearTimeout(timer);
	}, [policy]);

	function update(next: Partial<PrivacyPolicyContent>) {
		setPolicy((current) => ({ ...current, ...next }));
		setDirty(true);
	}

	function updateSection(index: number, section: PolicySectionContent) {
		update({
			sections: policy.sections.map((current, i) =>
				i === index ? section : current,
			),
		});
	}

	function issueFor(path: string) {
		return issues.find((issue) => issue.path === path)?.message;
	}

	const unknownTokens = [
		...new Set(collectText(policy).flatMap(findUnknownPolicyTokens)),
	];

	async function handlePublish() {
		setIsPublishing(true);
		setIssues([]);

		try {
			await savePrivacyPolicyDraftAction(policy);
			setSavedAt(new Date());
			setStatus("saved");

			const result = await publishPrivacyPolicyAction();

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
			await savePrivacyPolicyDraftAction(policy);
			setSavedAt(new Date());
			setStatus("saved");
		} catch {
			setStatus("error");
		}

		const url = await createPrivacyPolicyPreviewUrlAction();

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
				listAction={listPrivacyPolicyRevisionsAction}
				onClose={() => setHistoryOpen(false)}
				onRestored={() => router.refresh()}
				open={historyOpen}
				rollbackAction={rollbackPrivacyPolicyAction}
			/>

			<div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-8">
				<header>
					<h1 className="font-bold text-2xl tracking-tight">
						Política de Privacidade
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						As seções da política. Use tokens como{" "}
						<code className="rounded bg-muted px-1">{"{{site.email}}"}</code>{" "}
						para inserir dados das Configurações — eles são preenchidos ao
						publicar.
					</p>
				</header>

				<TokenPanel unknownTokens={unknownTokens} />

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

				<section className="flex flex-col gap-3">
					<h2 className="font-semibold text-lg">Cabeçalho</h2>
					<Field
						error={issueFor("updatedAt")}
						label="Data da última atualização"
					>
						<input
							className={fieldClassName}
							onChange={(event) => update({ updatedAt: event.target.value })}
							value={policy.updatedAt}
						/>
					</Field>
				</section>

				<IntroSection
					issueFor={issueFor}
					onChange={(intro) => update({ intro })}
					paragraphs={policy.intro}
				/>

				<section className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<h2 className="font-semibold text-lg">Seções</h2>
						<Button
							onClick={() =>
								update({
									sections: [
										...policy.sections,
										{
											id: nextSectionId(),
											title: "",
											blocks: [{ type: "paragraph", text: "" }],
										},
									],
								})
							}
							size="sm"
							type="button"
							variant="outline"
						>
							<Plus className="size-4" />
							Seção
						</Button>
					</div>

					{policy.sections.map((section, index) => (
						<SectionCard
							canMoveDown={index < policy.sections.length - 1}
							canMoveUp={index > 0}
							issueFor={issueFor}
							key={section.id}
							onChange={(next) => updateSection(index, next)}
							onMoveDown={() =>
								update({ sections: move(policy.sections, index, 1) })
							}
							onMoveUp={() =>
								update({ sections: move(policy.sections, index, -1) })
							}
							onRemove={() =>
								update({
									sections: policy.sections.filter((_, i) => i !== index),
								})
							}
							position={index}
							section={section}
						/>
					))}
				</section>
			</div>
		</div>
	);
}

function TokenPanel({ unknownTokens }: { unknownTokens: string[] }) {
	return (
		<div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3">
			<p className="font-medium text-sm">Tokens disponíveis</p>
			<div className="flex flex-wrap gap-1.5">
				{POLICY_TOKENS.map((entry) => (
					<code
						className="rounded bg-background px-1.5 py-0.5 text-muted-foreground text-xs"
						key={entry.token}
						title={entry.label}
					>
						{`{{${entry.token}}}`}
					</code>
				))}
			</div>
			{unknownTokens.length > 0 ? (
				<p className="text-destructive text-xs">
					Token desconhecido:{" "}
					{unknownTokens.map((token) => `{{${token}}}`).join(", ")}. Ele não
					será substituído no site.
				</p>
			) : null}
		</div>
	);
}

function IntroSection({
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
				<h2 className="font-semibold text-lg">Introdução</h2>
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
				<div
					className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4"
					key={index}
				>
					<div className="flex items-center justify-between">
						<span className="font-medium text-muted-foreground text-sm">
							Parágrafo {index + 1}
						</span>
						<Button
							aria-label="Remover parágrafo"
							disabled={paragraphs.length <= 1}
							onClick={() => onChange(paragraphs.filter((_, i) => i !== index))}
							size="icon"
							type="button"
							variant="ghost"
						>
							<Trash2 className="size-4 text-destructive" />
						</Button>
					</div>
					<textarea
						aria-label={`Parágrafo ${index + 1} da introdução`}
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
					{issueFor(`intro.${index}`) ? (
						<span className="text-destructive text-xs">
							{issueFor(`intro.${index}`)}
						</span>
					) : null}
				</div>
			))}
		</section>
	);
}

function SectionCard({
	section,
	position,
	canMoveUp,
	canMoveDown,
	issueFor,
	onChange,
	onMoveUp,
	onMoveDown,
	onRemove,
}: {
	section: PolicySectionContent;
	position: number;
	canMoveUp: boolean;
	canMoveDown: boolean;
	issueFor: (path: string) => string | undefined;
	onChange: (section: PolicySectionContent) => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onRemove: () => void;
}) {
	const base = `sections.${position}`;

	function updateBlock(index: number, block: PolicyBlockContent) {
		onChange({
			...section,
			blocks: section.blocks.map((current, i) =>
				i === index ? block : current,
			),
		});
	}

	function addBlock(block: PolicyBlockContent) {
		onChange({ ...section, blocks: [...section.blocks, block] });
	}

	return (
		<article className="rounded-xl border border-border bg-card p-4">
			<div className="mb-3 flex items-center justify-between gap-2">
				<span className="font-medium text-muted-foreground text-sm">
					Seção {position + 1}
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
						aria-label="Remover seção"
						onClick={onRemove}
						size="icon"
						type="button"
						variant="ghost"
					>
						<Trash2 className="size-4 text-destructive" />
					</Button>
				</div>
			</div>

			<Field error={issueFor(`${base}.title`)} label="Título">
				<input
					className={fieldClassName}
					onChange={(event) =>
						onChange({ ...section, title: event.target.value })
					}
					value={section.title}
				/>
			</Field>

			<div className="mt-4 flex flex-col gap-3">
				{section.blocks.map((block, index) => (
					<BlockCard
						base={`${base}.blocks.${index}`}
						block={block}
						canRemove={section.blocks.length > 1}
						issueFor={issueFor}
						key={index}
						onChange={(next) => updateBlock(index, next)}
						onRemove={() =>
							onChange({
								...section,
								blocks: section.blocks.filter((_, i) => i !== index),
							})
						}
						position={index}
					/>
				))}

				<div className="flex gap-2">
					<Button
						onClick={() => addBlock({ type: "paragraph", text: "" })}
						size="sm"
						type="button"
						variant="outline"
					>
						<Plus className="size-4" />
						Parágrafo
					</Button>
					<Button
						onClick={() => addBlock({ type: "list", items: [""] })}
						size="sm"
						type="button"
						variant="outline"
					>
						<List className="size-4" />
						Lista
					</Button>
				</div>
			</div>
		</article>
	);
}

function BlockCard({
	block,
	position,
	base,
	canRemove,
	issueFor,
	onChange,
	onRemove,
}: {
	block: PolicyBlockContent;
	position: number;
	base: string;
	canRemove: boolean;
	issueFor: (path: string) => string | undefined;
	onChange: (block: PolicyBlockContent) => void;
	onRemove: () => void;
}) {
	return (
		<div className="rounded-lg border border-border border-dashed p-3">
			<div className="mb-2 flex items-center justify-between">
				<span className="text-muted-foreground text-xs">
					{block.type === "list" ? "Lista" : "Parágrafo"} {position + 1}
				</span>
				<Button
					aria-label="Remover bloco"
					disabled={!canRemove}
					onClick={onRemove}
					size="icon"
					type="button"
					variant="ghost"
				>
					<Trash2 className="size-4 text-destructive" />
				</Button>
			</div>

			{block.type === "paragraph" ? (
				<Field error={issueFor(`${base}.text`)} label="Texto">
					<textarea
						className={cn(fieldClassName, "min-h-24 resize-y")}
						onChange={(event) =>
							onChange({ ...block, text: event.target.value })
						}
						value={block.text}
					/>
				</Field>
			) : (
				<div className="flex flex-col gap-3">
					<Field label="Frase de abertura (opcional)">
						<input
							className={fieldClassName}
							onChange={(event) =>
								onChange({
									...block,
									lead:
										event.target.value === "" ? undefined : event.target.value,
								})
							}
							value={block.lead ?? ""}
						/>
					</Field>
					<div className="flex flex-col gap-2">
						<span className="font-medium text-sm">Itens</span>
						{block.items.map((item, itemIndex) => (
							<div className="flex items-start gap-2" key={itemIndex}>
								<textarea
									aria-label={`Item ${itemIndex + 1}`}
									className={cn(fieldClassName, "min-h-12 flex-1 resize-y")}
									onChange={(event) =>
										onChange({
											...block,
											items: block.items.map((current, i) =>
												i === itemIndex ? event.target.value : current,
											),
										})
									}
									value={item}
								/>
								<Button
									aria-label="Remover item"
									disabled={block.items.length <= 1}
									onClick={() =>
										onChange({
											...block,
											items: block.items.filter((_, i) => i !== itemIndex),
										})
									}
									size="icon"
									type="button"
									variant="ghost"
								>
									<Trash2 className="size-4 text-destructive" />
								</Button>
							</div>
						))}
						<Button
							className="w-fit"
							onClick={() =>
								onChange({ ...block, items: [...block.items, ""] })
							}
							size="sm"
							type="button"
							variant="ghost"
						>
							<Plus className="size-4" />
							Item
						</Button>
					</div>
				</div>
			)}
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
