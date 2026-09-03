import {
	type LeadKind,
	type LeadSnapshot,
	type LeadStatus,
	PhoneNumber,
} from "@plastlima-app/core";
import { Check, Download, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireActor } from "@/lib/auth-actor";
import { createListLeads } from "@/lib/leads";
import { setLeadStatusAction } from "./actions";

export const metadata: Metadata = { title: "Leads" };

const PAGE_SIZE = 25;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
	dateStyle: "short",
	timeStyle: "short",
	timeZone: "America/Fortaleza",
});

const KIND_LABELS: Record<LeadKind, string> = {
	contact: "Contato",
	franchise: "Franquia",
};

/** Quanto da mensagem cabe na linha antes de virar um "ver mais". */
const MESSAGE_PREVIEW_LENGTH = 90;

type PageProps = {
	searchParams: Promise<{
		busca?: string;
		origem?: string;
		situacao?: string;
		pagina?: string;
	}>;
};

export default async function LeadsPage({ searchParams }: PageProps) {
	await requireActor();

	const params = await searchParams;
	const kind = toKind(params.origem);
	const status = toStatus(params.situacao);
	const search = params.busca?.trim() || undefined;
	const page = Math.max(1, Number.parseInt(params.pagina ?? "1", 10) || 1);

	const useCase = createListLeads();

	const [result, newCount] = await Promise.all([
		useCase.execute({ kind, status, search, page, pageSize: PAGE_SIZE }),
		useCase.countNew(),
	]);

	const lastPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
	const filters = { busca: search, origem: kind, situacao: status };

	return (
		<div className="mx-auto w-full max-w-6xl px-6 py-8">
			<header className="mb-6">
				<h1 className="font-bold text-2xl tracking-tight">Leads</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Mensagens do formulário de contato e interessados em franquia.{" "}
					{newCount === 0
						? "Nenhum aguardando atendimento."
						: `${newCount} ${newCount === 1 ? "aguarda" : "aguardam"} atendimento.`}
				</p>
			</header>

			<search className="mb-5 block">
				<form className="flex flex-wrap items-center gap-2" method="get">
					<input
						aria-label="Buscar por nome, e-mail ou telefone"
						className="w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
						defaultValue={search ?? ""}
						name="busca"
						placeholder="Buscar por nome, e-mail ou telefone"
						type="search"
					/>

					<select
						aria-label="Origem"
						className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
						defaultValue={kind ?? ""}
						name="origem"
					>
						<option value="">Todas as origens</option>
						<option value="contact">Contato</option>
						<option value="franchise">Franquia</option>
					</select>

					<select
						aria-label="Situação"
						className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
						defaultValue={status ?? ""}
						name="situacao"
					>
						<option value="">Todas as situações</option>
						<option value="new">Novos</option>
						<option value="handled">Atendidos</option>
					</select>

					<button
						className="cursor-pointer rounded-lg border border-border px-3 py-2 font-medium text-sm transition-colors hover:bg-muted"
						type="submit"
					>
						Filtrar
					</button>

					<a
						className="ml-auto flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 py-2 font-semibold text-sm text-white transition-colors hover:bg-brand-dark"
						href={`/leads/exportar${queryString(filters)}`}
					>
						<Download aria-hidden className="size-4" />
						Exportar CSV
					</a>
				</form>
			</search>

			{result.items.length === 0 ? (
				<p className="rounded-xl border border-border border-dashed px-6 py-16 text-center text-muted-foreground text-sm">
					{search || kind || status
						? "Nenhum lead encontrado com esses filtros."
						: "Nenhum lead recebido ainda."}
				</p>
			) : (
				<div className="overflow-x-auto rounded-xl border border-border">
					<table className="w-full min-w-[900px] border-collapse text-sm">
						<thead className="bg-muted/50 text-left">
							<tr>
								<th className="px-4 py-3 font-semibold">Origem</th>
								<th className="px-4 py-3 font-semibold">Contato</th>
								<th className="px-4 py-3 font-semibold">Local</th>
								<th className="px-4 py-3 font-semibold">Mensagem</th>
								<th className="px-4 py-3 font-semibold">Recebido</th>
								<th className="px-4 py-3 text-right font-semibold">Situação</th>
							</tr>
						</thead>
						<tbody>
							{result.items.map((lead) => (
								<LeadRow key={lead.toSnapshot().id} lead={lead.toSnapshot()} />
							))}
						</tbody>
					</table>
				</div>
			)}

			{lastPage > 1 ? (
				<nav
					aria-label="Paginação"
					className="mt-5 flex items-center justify-between text-sm"
				>
					<span className="text-muted-foreground">
						Página {page} de {lastPage}
					</span>
					<div className="flex gap-2">
						{page > 1 ? (
							<Link
								className="rounded-lg border border-border px-3 py-1.5 transition-colors hover:bg-muted"
								href={`/leads${queryString({ ...filters, pagina: String(page - 1) })}`}
							>
								Anterior
							</Link>
						) : null}
						{page < lastPage ? (
							<Link
								className="rounded-lg border border-border px-3 py-1.5 transition-colors hover:bg-muted"
								href={`/leads${queryString({ ...filters, pagina: String(page + 1) })}`}
							>
								Próxima
							</Link>
						) : null}
					</div>
				</nav>
			) : null}
		</div>
	);
}

function LeadRow({ lead }: { lead: LeadSnapshot }) {
	const isHandled = lead.status === "handled";

	return (
		<tr className="border-border border-t align-top">
			<td className="px-4 py-3">
				<span
					className={
						lead.kind === "franchise"
							? "rounded-full bg-brand/10 px-2 py-0.5 font-medium text-brand text-xs"
							: "rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs"
					}
				>
					{KIND_LABELS[lead.kind]}
				</span>
			</td>

			<td className="px-4 py-3">
				<p className="font-medium">{lead.name}</p>
				<a
					className="text-muted-foreground text-xs hover:text-brand hover:underline"
					href={`mailto:${lead.email}`}
				>
					{lead.email}
				</a>
				{lead.phone === null ? null : (
					<p className="text-xs tabular-nums">
						<PhoneLink display={lead.phone} />
					</p>
				)}
			</td>

			<td className="px-4 py-3 text-muted-foreground">
				{formatPlace(lead.city, lead.state)}
			</td>

			<td className="max-w-[320px] px-4 py-3">
				<Message text={lead.message} />
			</td>

			<td className="px-4 py-3 text-muted-foreground tabular-nums">
				{dateFormatter.format(lead.createdAt)}
				{isHandled && lead.handledBy !== null ? (
					<p className="mt-1 text-xs">Atendido por {lead.handledBy}</p>
				) : null}
			</td>

			<td className="px-4 py-3 text-right">
				<form action={setLeadStatusAction}>
					<input name="id" type="hidden" value={lead.id ?? ""} />
					<input
						name="handled"
						type="hidden"
						value={isHandled ? "false" : "true"}
					/>
					<button
						className={
							isHandled
								? "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-muted-foreground text-xs transition-colors hover:bg-muted"
								: "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1.5 font-medium text-brand text-xs transition-colors hover:bg-brand/20"
						}
						type="submit"
					>
						{isHandled ? (
							<>
								<RotateCcw aria-hidden className="size-3.5" />
								Reabrir
							</>
						) : (
							<>
								<Check aria-hidden className="size-3.5" />
								Marcar atendido
							</>
						)}
					</button>
				</form>
			</td>
		</tr>
	);
}

/**
 * Telefone clicável quando é um número brasileiro reconhecível.
 *
 * Reusa o value object da campanha para normalizar: se o `PhoneNumber` recusa,
 * o texto continua visível — só não vira link, porque um `wa.me` com número
 * inválido leva a equipe a uma conversa que não existe.
 */
function PhoneLink({ display }: { display: string }) {
	const phone = PhoneNumber.create(display);

	if (!phone.ok) {
		return <span className="text-muted-foreground">{display}</span>;
	}

	return (
		<a
			className="hover:text-brand hover:underline"
			href={`https://wa.me/${phone.value.value}`}
			rel="noreferrer"
			target="_blank"
		>
			{phone.value.display}
		</a>
	);
}

/** Mensagem curta inteira; longa, atrás de um "ver mensagem" que não estica a linha. */
function Message({ text }: { text: string | null }) {
	if (text === null) {
		return <span className="text-muted-foreground">—</span>;
	}

	if (text.length <= MESSAGE_PREVIEW_LENGTH) {
		return <p className="whitespace-pre-line">{text}</p>;
	}

	return (
		<details>
			<summary className="cursor-pointer text-muted-foreground marker:text-brand">
				{`${text.slice(0, MESSAGE_PREVIEW_LENGTH)}…`}
			</summary>
			<p className="mt-2 whitespace-pre-line">{text}</p>
		</details>
	);
}

function formatPlace(city: string | null, state: string | null): string {
	return [city, state].filter((part) => part !== null).join(" — ") || "—";
}

function toKind(value: string | undefined): LeadKind | undefined {
	return value === "contact" || value === "franchise" ? value : undefined;
}

function toStatus(value: string | undefined): LeadStatus | undefined {
	return value === "new" || value === "handled" ? value : undefined;
}

/** Monta a query preservando os filtros ativos e omitindo os vazios. */
function queryString(params: Record<string, string | undefined>): string {
	const search = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value.length > 0) {
			search.set(key, value);
		}
	}

	const query = search.toString();

	return query.length === 0 ? "" : `?${query}`;
}
