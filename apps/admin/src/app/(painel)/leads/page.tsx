import {
	type LeadKind,
	type LeadSnapshot,
	type LeadStatus,
	PhoneNumber,
} from "@plastlima-app/core";
import { Badge } from "@plastlima-app/ui/components/badge";
import { Button, buttonVariants } from "@plastlima-app/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@plastlima-app/ui/components/table";
import { Check, RotateCcw } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { LeadsFilters } from "@/components/painel/leads-filters";
import { PageHeader, PageShell } from "@/components/painel/page-shell";
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
	const pageHref = (target: number): Route => {
		const query = new URLSearchParams();
		if (search) query.set("busca", search);
		if (kind) query.set("origem", kind);
		if (status) query.set("situacao", status);
		query.set("pagina", String(target));
		return `/leads?${query.toString()}` as Route;
	};

	return (
		<PageShell>
			<PageHeader
				description={
					<>
						Mensagens do formulário de contato e interessados em franquia.{" "}
						{newCount === 0 ? (
							"Nenhum aguardando atendimento."
						) : (
							<span className="font-medium text-primary">
								{newCount} {newCount === 1 ? "aguarda" : "aguardam"}{" "}
								atendimento.
							</span>
						)}
					</>
				}
				title="Leads"
			/>

			<LeadsFilters kind={kind} search={search} status={status} />

			{result.items.length === 0 ? (
				<p className="rounded-xl border border-dashed px-6 py-16 text-center text-muted-foreground text-sm">
					{search || kind || status
						? "Nenhum lead encontrado com esses filtros."
						: "Nenhum lead recebido ainda."}
				</p>
			) : (
				<div className="overflow-hidden rounded-xl border bg-card">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Origem</TableHead>
								<TableHead>Contato</TableHead>
								<TableHead>Local</TableHead>
								<TableHead>Mensagem</TableHead>
								<TableHead>Recebido</TableHead>
								<TableHead className="text-right">Situação</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{result.items.map((lead) => (
								<LeadRow key={lead.toSnapshot().id} lead={lead.toSnapshot()} />
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{lastPage > 1 ? (
				<nav
					aria-label="Paginação"
					className="flex items-center justify-between text-sm"
				>
					<span className="text-muted-foreground">
						Página {page} de {lastPage}
					</span>
					<div className="flex gap-2">
						{page > 1 ? (
							<Link
								className={buttonVariants({ size: "sm", variant: "outline" })}
								href={pageHref(page - 1)}
							>
								Anterior
							</Link>
						) : null}
						{page < lastPage ? (
							<Link
								className={buttonVariants({ size: "sm", variant: "outline" })}
								href={pageHref(page + 1)}
							>
								Próxima
							</Link>
						) : null}
					</div>
				</nav>
			) : null}
		</PageShell>
	);
}

function LeadRow({ lead }: { lead: LeadSnapshot }) {
	const isHandled = lead.status === "handled";

	return (
		<TableRow className="align-top">
			<TableCell>
				<Badge variant={lead.kind === "franchise" ? "default" : "secondary"}>
					{KIND_LABELS[lead.kind]}
				</Badge>
			</TableCell>

			<TableCell>
				<p className="font-medium">{lead.name}</p>
				<a
					className="text-muted-foreground text-xs hover:text-primary hover:underline"
					href={`mailto:${lead.email}`}
				>
					{lead.email}
				</a>
				{lead.phone === null ? null : (
					<p className="text-xs tabular-nums">
						<PhoneLink display={lead.phone} />
					</p>
				)}
			</TableCell>

			<TableCell className="text-muted-foreground">
				{formatPlace(lead.city, lead.state)}
			</TableCell>

			<TableCell className="max-w-[320px]">
				<Message text={lead.message} />
			</TableCell>

			<TableCell className="text-muted-foreground tabular-nums">
				{dateFormatter.format(lead.createdAt)}
				{isHandled && lead.handledBy !== null ? (
					<p className="mt-1 text-xs">Atendido por {lead.handledBy}</p>
				) : null}
			</TableCell>

			<TableCell className="text-right">
				<form action={setLeadStatusAction}>
					<input name="id" type="hidden" value={lead.id ?? ""} />
					<input
						name="handled"
						type="hidden"
						value={isHandled ? "false" : "true"}
					/>
					<Button
						size="sm"
						type="submit"
						variant={isHandled ? "ghost" : "default"}
					>
						{isHandled ? (
							<>
								<RotateCcw />
								Reabrir
							</>
						) : (
							<>
								<Check />
								Marcar atendido
							</>
						)}
					</Button>
				</form>
			</TableCell>
		</TableRow>
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
			className="hover:text-primary hover:underline"
			href={`https://wa.me/${phone.value.value}`}
			rel="noreferrer"
			target="_blank"
		>
			{phone.value.display}
		</a>
	);
}

/** Mensagem curta inteira; longa, atrás de um "ver mais" que não estica a linha. */
function Message({ text }: { text: string | null }) {
	if (text === null) {
		return <span className="text-muted-foreground">—</span>;
	}

	if (text.length <= MESSAGE_PREVIEW_LENGTH) {
		return <p className="whitespace-pre-line">{text}</p>;
	}

	return (
		<details>
			<summary className="cursor-pointer text-muted-foreground marker:text-primary">
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
