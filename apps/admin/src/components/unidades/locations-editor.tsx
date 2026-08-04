"use client";

import {
	LOCATION_STATES,
	type LocationsContent,
	type OpeningHoursContent,
	type StoreLocationContent,
} from "@plastlima-app/core/schemas";
import { Button } from "@plastlima-app/ui/components/button";
import { cn } from "@plastlima-app/ui/lib/utils";
import {
	ArrowDown,
	ArrowUp,
	Eye,
	History,
	Plus,
	Store,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { PublishIssue } from "@/app/(painel)/inicio/actions";
import {
	createLocationsPreviewUrlAction,
	listLocationsRevisionsAction,
	publishLocationsAction,
	rollbackLocationsAction,
	saveLocationsDraftAction,
} from "@/app/(painel)/unidades/actions";
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

let storeCounter = 0;
function nextStoreId(): string {
	storeCounter += 1;
	return `loja-${storeCounter}`;
}

function emptyStore(): StoreLocationContent {
	return {
		id: nextStoreId(),
		name: "",
		state: "Piauí",
		city: "",
		phone: "",
		whatsappUrl: "",
		mapEmbedUrl: "",
		hours: [{ days: "", time: "" }],
	};
}

type Props = {
	initialLocations: LocationsContent;
	initialUpdatedAt: string | null;
	initialStateLabel: string;
	initialCanPublish: boolean;
};

export function LocationsEditor({
	initialLocations,
	initialUpdatedAt,
	initialStateLabel,
	initialCanPublish,
}: Props) {
	const [locations, setLocations] =
		useState<LocationsContent>(initialLocations);
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
				const result = await saveLocationsDraftAction(locations);
				setSavedAt(new Date(result.savedAt));
				setStatus("saved");
			} catch {
				setStatus("error");
			}
		}, AUTOSAVE_DELAY_MS);

		return () => clearTimeout(timer);
	}, [locations]);

	function update(next: LocationsContent) {
		setLocations(next);
		setDirty(true);
	}

	function updateStore(index: number, store: StoreLocationContent) {
		update({
			...locations,
			stores: locations.stores.map((current, i) =>
				i === index ? store : current,
			),
		});
	}

	function addStore() {
		update({ ...locations, stores: [...locations.stores, emptyStore()] });
	}

	function removeStore(index: number) {
		update({
			...locations,
			stores: locations.stores.filter((_, i) => i !== index),
		});
	}

	function moveStore(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= locations.stores.length) {
			return;
		}
		const stores = [...locations.stores];
		const [moved] = stores.splice(index, 1);
		if (moved !== undefined) {
			stores.splice(target, 0, moved);
		}
		update({ ...locations, stores });
	}

	async function handlePublish() {
		setIsPublishing(true);
		setIssues([]);

		try {
			await saveLocationsDraftAction(locations);
			setSavedAt(new Date());
			setStatus("saved");

			const result = await publishLocationsAction();

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
			await saveLocationsDraftAction(locations);
			setSavedAt(new Date());
			setStatus("saved");
		} catch {
			setStatus("error");
		}

		const url = await createLocationsPreviewUrlAction();

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
				listAction={listLocationsRevisionsAction}
				onClose={() => setHistoryOpen(false)}
				onRestored={() => router.refresh()}
				open={historyOpen}
				rollbackAction={rollbackLocationsAction}
			/>

			<div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-8">
				<header>
					<h1 className="font-bold text-2xl tracking-tight">Unidades</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						As lojas físicas exibidas na página de unidades do site, com
						endereço no mapa, contato e horários.
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
						<h2 className="font-semibold text-lg">
							{locations.stores.length} unidades
						</h2>
						<Button
							onClick={addStore}
							size="sm"
							type="button"
							variant="outline"
						>
							<Plus className="size-4" />
							Nova unidade
						</Button>
					</div>

					{locations.stores.map((store, index) => (
						<StoreCard
							canMoveDown={index < locations.stores.length - 1}
							canMoveUp={index > 0}
							issueFor={(field) =>
								issues.find(
									(issue) => issue.path === `stores.${index}.${field}`,
								)?.message
							}
							key={store.id}
							onChange={(next) => updateStore(index, next)}
							onMoveDown={() => moveStore(index, 1)}
							onMoveUp={() => moveStore(index, -1)}
							onRemove={() => removeStore(index)}
							position={index}
							store={store}
						/>
					))}

					{locations.stores.length === 0 ? (
						<p className="rounded-xl border border-border border-dashed px-4 py-8 text-center text-muted-foreground text-sm">
							Nenhuma unidade. Adicione a primeira para publicar.
						</p>
					) : null}
				</section>
			</div>
		</div>
	);
}

function StoreCard({
	store,
	position,
	canMoveUp,
	canMoveDown,
	issueFor,
	onChange,
	onMoveUp,
	onMoveDown,
	onRemove,
}: {
	store: StoreLocationContent;
	position: number;
	canMoveUp: boolean;
	canMoveDown: boolean;
	issueFor: (field: string) => string | undefined;
	onChange: (store: StoreLocationContent) => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onRemove: () => void;
}) {
	function addHour() {
		onChange({ ...store, hours: [...store.hours, { days: "", time: "" }] });
	}

	function updateHour(index: number, hour: OpeningHoursContent) {
		onChange({
			...store,
			hours: store.hours.map((current, i) => (i === index ? hour : current)),
		});
	}

	function removeHour(index: number) {
		onChange({ ...store, hours: store.hours.filter((_, i) => i !== index) });
	}

	return (
		<article className="rounded-xl border border-border bg-card p-4">
			<div className="mb-3 flex items-center justify-between gap-2">
				<span className="flex min-w-0 items-center gap-2 font-medium text-sm">
					<Store
						aria-hidden
						className="size-4 shrink-0 text-muted-foreground"
					/>
					<span className="truncate">
						{store.name.trim() === "" ? `Unidade ${position + 1}` : store.name}
					</span>
				</span>
				<div className="flex shrink-0 items-center gap-1">
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
						aria-label="Remover unidade"
						onClick={onRemove}
						size="icon"
						type="button"
						variant="ghost"
					>
						<Trash2 className="size-4 text-destructive" />
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<Field error={issueFor("name")} label="Nome da loja">
					<input
						className={fieldClassName}
						onChange={(event) =>
							onChange({ ...store, name: event.target.value })
						}
						value={store.name}
					/>
				</Field>
				<Field error={issueFor("city")} label="Cidade">
					<input
						className={fieldClassName}
						onChange={(event) =>
							onChange({ ...store, city: event.target.value })
						}
						value={store.city}
					/>
				</Field>
				<Field error={issueFor("state")} label="Estado">
					<select
						className={fieldClassName}
						onChange={(event) =>
							onChange({
								...store,
								state: event.target.value as StoreLocationContent["state"],
							})
						}
						value={store.state}
					>
						{LOCATION_STATES.map((state) => (
							<option key={state} value={state}>
								{state}
							</option>
						))}
					</select>
				</Field>
				<Field error={issueFor("phone")} label="Telefone">
					<input
						className={fieldClassName}
						onChange={(event) =>
							onChange({ ...store, phone: event.target.value })
						}
						value={store.phone}
					/>
				</Field>
				<Field error={issueFor("whatsappUrl")} label="Link do WhatsApp">
					<input
						className={fieldClassName}
						onChange={(event) =>
							onChange({ ...store, whatsappUrl: event.target.value })
						}
						placeholder="https://wa.me/55..."
						value={store.whatsappUrl}
					/>
				</Field>
				<Field
					error={issueFor("instagramUrl")}
					label="Link do Instagram (opcional)"
				>
					<input
						className={fieldClassName}
						onChange={(event) =>
							onChange({
								...store,
								instagramUrl:
									event.target.value === "" ? undefined : event.target.value,
							})
						}
						placeholder="https://instagram.com/..."
						value={store.instagramUrl ?? ""}
					/>
				</Field>
			</div>

			<div className="mt-3">
				<Field
					error={issueFor("mapEmbedUrl")}
					label="Mapa (URL de incorporação)"
				>
					<textarea
						className={cn(
							fieldClassName,
							"min-h-20 resize-y font-mono text-xs",
						)}
						onChange={(event) =>
							onChange({ ...store, mapEmbedUrl: event.target.value })
						}
						placeholder="https://maps.google.com/maps?q=...&output=embed"
						value={store.mapEmbedUrl}
					/>
				</Field>
			</div>

			<div className="mt-4 flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<span className="font-medium text-sm">Horários</span>
					<Button onClick={addHour} size="sm" type="button" variant="ghost">
						<Plus className="size-4" />
						Faixa
					</Button>
				</div>
				{issueFor("hours") ? (
					<span className="text-destructive text-xs">{issueFor("hours")}</span>
				) : null}
				{store.hours.map((hour, hourIndex) => (
					<div className="flex items-start gap-2" key={hourIndex}>
						<input
							aria-label="Dias"
							className={cn(fieldClassName, "flex-1")}
							onChange={(event) =>
								updateHour(hourIndex, { ...hour, days: event.target.value })
							}
							placeholder="Segunda a Sexta"
							value={hour.days}
						/>
						<input
							aria-label="Horário"
							className={cn(fieldClassName, "flex-1")}
							onChange={(event) =>
								updateHour(hourIndex, { ...hour, time: event.target.value })
							}
							placeholder="08h – 17h"
							value={hour.time}
						/>
						<Button
							aria-label="Remover faixa de horário"
							disabled={store.hours.length <= 1}
							onClick={() => removeHour(hourIndex)}
							size="icon"
							type="button"
							variant="ghost"
						>
							<Trash2 className="size-4 text-destructive" />
						</Button>
					</div>
				))}
			</div>
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
