"use client";

import type { SiteContent } from "@plastlima-app/core/schemas";
import { Button } from "@plastlima-app/ui/components/button";
import { cn } from "@plastlima-app/ui/lib/utils";
import { ArrowDown, ArrowUp, Eye, History, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	createSitePreviewUrlAction,
	listSiteRevisionsAction,
	publishSiteAction,
	rollbackSiteAction,
	saveSiteDraftAction,
} from "@/app/(painel)/config/actions";
import type { PublishIssue } from "@/app/(painel)/inicio/actions";
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

type Props = {
	initialSite: SiteContent;
	initialUpdatedAt: string | null;
	initialStateLabel: string;
	initialCanPublish: boolean;
};

export function SiteEditor({
	initialSite,
	initialUpdatedAt,
	initialStateLabel,
	initialCanPublish,
}: Props) {
	const [site, setSite] = useState<SiteContent>(initialSite);
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
				const result = await saveSiteDraftAction(site);
				setSavedAt(new Date(result.savedAt));
				setStatus("saved");
			} catch {
				setStatus("error");
			}
		}, AUTOSAVE_DELAY_MS);

		return () => clearTimeout(timer);
	}, [site]);

	function update(next: SiteContent) {
		setSite(next);
		setDirty(true);
	}

	function setField<K extends keyof SiteContent>(
		key: K,
		value: SiteContent[K],
	) {
		update({ ...site, [key]: value });
	}

	function setPhone(
		kind: "support" | "franchise",
		field: "phone" | "display",
		value: string,
	) {
		update({
			...site,
			contact: {
				...site.contact,
				[kind]: { ...site.contact[kind], [field]: value },
			},
		});
	}

	function setSocial(
		index: number,
		patch: Partial<SiteContent["social"][number]>,
	) {
		update({
			...site,
			social: site.social.map((link, i) =>
				i === index ? { ...link, ...patch } : link,
			),
		});
	}

	function addSocial() {
		update({
			...site,
			social: [...site.social, { platform: "", label: "", href: "" }],
		});
	}

	function removeSocial(index: number) {
		update({ ...site, social: site.social.filter((_, i) => i !== index) });
	}

	function moveSocial(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= site.social.length) {
			return;
		}
		const social = [...site.social];
		const [moved] = social.splice(index, 1);
		if (moved !== undefined) {
			social.splice(target, 0, moved);
		}
		update({ ...site, social });
	}

	async function handlePublish() {
		setIsPublishing(true);
		setIssues([]);

		try {
			await saveSiteDraftAction(site);
			setSavedAt(new Date());
			setStatus("saved");

			const result = await publishSiteAction();

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
			await saveSiteDraftAction(site);
			setSavedAt(new Date());
			setStatus("saved");
		} catch {
			setStatus("error");
		}

		const url = await createSitePreviewUrlAction();

		if (url === null) {
			toast.error(
				"Pré-visualização indisponível: configure PREVIEW_SECRET e PUBLIC_SITE_URL.",
			);
			return;
		}

		window.open(url, "_blank", "noopener,noreferrer");
	}

	function issueFor(path: string): string | undefined {
		return issues.find((issue) => issue.path === path)?.message;
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
				listAction={listSiteRevisionsAction}
				onClose={() => setHistoryOpen(false)}
				onRestored={() => router.refresh()}
				open={historyOpen}
				rollbackAction={rollbackSiteAction}
			/>

			<div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-8">
				<header>
					<h1 className="font-bold text-2xl tracking-tight">
						Configurações do site
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Identidade, contatos e redes sociais que aparecem no cabeçalho e no
						rodapé.
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

				<Section title="Identidade">
					<Field error={issueFor("name")} label="Nome">
						<input
							className={fieldClassName}
							onChange={(event) => setField("name", event.target.value)}
							value={site.name}
						/>
					</Field>
					<Field error={issueFor("tagline")} label="Chamada (tagline)">
						<textarea
							className={cn(fieldClassName, "min-h-16 resize-y")}
							onChange={(event) => setField("tagline", event.target.value)}
							value={site.tagline}
						/>
					</Field>
					<Field error={issueFor("description")} label="Descrição">
						<textarea
							className={cn(fieldClassName, "min-h-20 resize-y")}
							onChange={(event) => setField("description", event.target.value)}
							value={site.description}
						/>
					</Field>
					<Field error={issueFor("address")} label="Endereço">
						<input
							className={fieldClassName}
							onChange={(event) => setField("address", event.target.value)}
							value={site.address}
						/>
					</Field>
					<Field error={issueFor("copyright")} label="Copyright">
						<input
							className={fieldClassName}
							onChange={(event) => setField("copyright", event.target.value)}
							value={site.copyright}
						/>
					</Field>
				</Section>

				<Section title="Contatos">
					<div className="grid grid-cols-2 gap-3">
						<Field error={issueFor("email")} label="E-mail de atendimento">
							<input
								className={fieldClassName}
								onChange={(event) => setField("email", event.target.value)}
								value={site.email}
							/>
						</Field>
						<Field
							error={issueFor("franchiseEmail")}
							label="E-mail de franquias"
						>
							<input
								className={fieldClassName}
								onChange={(event) =>
									setField("franchiseEmail", event.target.value)
								}
								value={site.franchiseEmail}
							/>
						</Field>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<Field
							error={issueFor("contact.support.phone")}
							label="WhatsApp atendimento (só dígitos)"
						>
							<input
								className={fieldClassName}
								onChange={(event) =>
									setPhone("support", "phone", event.target.value)
								}
								value={site.contact.support.phone}
							/>
						</Field>
						<Field
							error={issueFor("contact.support.display")}
							label="Atendimento (exibição)"
						>
							<input
								className={fieldClassName}
								onChange={(event) =>
									setPhone("support", "display", event.target.value)
								}
								value={site.contact.support.display}
							/>
						</Field>
						<Field
							error={issueFor("contact.franchise.phone")}
							label="WhatsApp franquias (só dígitos)"
						>
							<input
								className={fieldClassName}
								onChange={(event) =>
									setPhone("franchise", "phone", event.target.value)
								}
								value={site.contact.franchise.phone}
							/>
						</Field>
						<Field
							error={issueFor("contact.franchise.display")}
							label="Franquias (exibição)"
						>
							<input
								className={fieldClassName}
								onChange={(event) =>
									setPhone("franchise", "display", event.target.value)
								}
								value={site.contact.franchise.display}
							/>
						</Field>
					</div>

					<Field
						error={issueFor("externalLinks.onlineCatalog")}
						label="Catálogo online (URL)"
					>
						<input
							className={fieldClassName}
							onChange={(event) =>
								setField("externalLinks", {
									...site.externalLinks,
									onlineCatalog: event.target.value,
								})
							}
							value={site.externalLinks.onlineCatalog}
						/>
					</Field>
				</Section>

				<Section
					action={
						<Button
							onClick={addSocial}
							size="sm"
							type="button"
							variant="outline"
						>
							<Plus className="size-4" />
							Nova rede
						</Button>
					}
					title="Redes sociais"
				>
					{site.social.map((link, index) => (
						<div className="rounded-xl border border-border p-4" key={index}>
							<div className="mb-3 flex items-center justify-between">
								<span className="font-medium text-muted-foreground text-sm">
									Rede {index + 1}
								</span>
								<div className="flex items-center gap-1">
									<Button
										aria-label="Mover para cima"
										disabled={index === 0}
										onClick={() => moveSocial(index, -1)}
										size="icon"
										type="button"
										variant="ghost"
									>
										<ArrowUp className="size-4" />
									</Button>
									<Button
										aria-label="Mover para baixo"
										disabled={index === site.social.length - 1}
										onClick={() => moveSocial(index, 1)}
										size="icon"
										type="button"
										variant="ghost"
									>
										<ArrowDown className="size-4" />
									</Button>
									<Button
										aria-label="Remover rede"
										onClick={() => removeSocial(index)}
										size="icon"
										type="button"
										variant="ghost"
									>
										<Trash2 className="size-4 text-destructive" />
									</Button>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<Field
									error={issueFor(`social.${index}.platform`)}
									label="Plataforma (facebook, instagram, whatsapp)"
								>
									<input
										className={fieldClassName}
										onChange={(event) =>
											setSocial(index, { platform: event.target.value })
										}
										value={link.platform}
									/>
								</Field>
								<Field error={issueFor(`social.${index}.label`)} label="Rótulo">
									<input
										className={fieldClassName}
										onChange={(event) =>
											setSocial(index, { label: event.target.value })
										}
										value={link.label}
									/>
								</Field>
							</div>
							<div className="mt-3">
								<Field
									error={issueFor(`social.${index}.href`)}
									label="Link (URL)"
								>
									<input
										className={fieldClassName}
										onChange={(event) =>
											setSocial(index, { href: event.target.value })
										}
										value={link.href}
									/>
								</Field>
							</div>
						</div>
					))}
				</Section>
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

function Section({
	title,
	action,
	children,
}: {
	title: string;
	action?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-lg">{title}</h2>
				{action}
			</div>
			{children}
		</section>
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
