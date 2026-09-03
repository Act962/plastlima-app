import { POOL_LABELS, type RafflePool } from "@plastlima-app/core";
import { Badge } from "@plastlima-app/ui/components/badge";
import { Button, buttonVariants } from "@plastlima-app/ui/components/button";
import { Input } from "@plastlima-app/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@plastlima-app/ui/components/table";
import { Download, Search } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader, PageShell } from "@/components/painel/page-shell";
import { requireActor } from "@/lib/auth-actor";
import { createListParticipants } from "@/lib/participants";

export const metadata: Metadata = { title: "Participantes" };

const PAGE_SIZE = 25;

// Data e hora em duas linhas, em vez de "03/09/2026, 17:51" numa só: com oito
// colunas, o formato corrido era o que ainda fazia a tabela passar da largura.
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
	dateStyle: "short",
	timeZone: "America/Fortaleza",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
	timeStyle: "short",
	timeZone: "America/Fortaleza",
});

/**
 * Abas de grupo.
 *
 * A campanha entrega duas TVs, uma por grupo, e cada uma é apurada na sua base.
 * "Todos" existe para a conferência do total, mas quem vai sortear precisa
 * enxergar um grupo de cada vez.
 */
const POOL_TABS: { value: RafflePool | null; label: string }[] = [
	{ value: null, label: "Todos" },
	{ value: "cd", label: POOL_LABELS.cd },
	{ value: "unidades", label: POOL_LABELS.unidades },
];

/**
 * Rótulo curto do selo na tabela.
 *
 * O nome inteiro aparece nas abas do filtro e, para quem é do CD, na própria
 * coluna "Onde comprou" — repeti-lo no selo só empurrava a tabela para fora da
 * largura do painel.
 */
const POOL_BADGES: Record<RafflePool, string> = {
	cd: "CD",
	unidades: "Lojas",
};

type PageProps = {
	searchParams: Promise<{ busca?: string; pagina?: string; grupo?: string }>;
};

export default async function ParticipantsPage({ searchParams }: PageProps) {
	await requireActor();

	const { busca, pagina, grupo } = await searchParams;
	const search = busca?.trim() || undefined;
	const page = Math.max(1, Number.parseInt(pagina ?? "1", 10) || 1);
	// Só "cd" e "unidades" filtram; qualquer outra coisa na URL vira "todos".
	const pool: RafflePool | undefined =
		grupo === "cd" || grupo === "unidades" ? grupo : undefined;

	const result = await createListParticipants().execute({
		pool,
		search,
		page,
		pageSize: PAGE_SIZE,
	});

	const lastPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

	const params = (extra: Record<string, string | number | undefined>) => {
		const query = new URLSearchParams();

		for (const [key, value] of Object.entries({
			busca: search,
			grupo: pool,
			...extra,
		})) {
			if (value !== undefined && value !== "") {
				query.set(key, String(value));
			}
		}

		const suffix = query.toString();

		return suffix.length > 0 ? `?${suffix}` : "";
	};

	const exportHref = `/participantes/exportar${params({})}`;
	const pageHref = (target: number): Route =>
		`/participantes${params({ pagina: target })}` as Route;
	// Trocar de grupo volta para a primeira página: a paginação do grupo anterior
	// não vale para o novo recorte.
	const poolHref = (target: RafflePool | null): Route => {
		const query = new URLSearchParams();

		if (search !== undefined) {
			query.set("busca", search);
		}

		if (target !== null) {
			query.set("grupo", target);
		}

		const suffix = query.toString();

		return `/participantes${suffix.length > 0 ? `?${suffix}` : ""}` as Route;
	};

	return (
		<PageShell>
			<PageHeader
				description={`Sorteio das TVs · ${pool === undefined ? "todos os grupos" : POOL_LABELS[pool]} — ${result.total} ${result.total === 1 ? "inscrito" : "inscritos"}.`}
				title="Participantes"
			/>

			<nav aria-label="Filtrar por grupo" className="flex flex-wrap gap-2">
				{POOL_TABS.map((tab) => {
					const active = (tab.value ?? null) === (pool ?? null);

					return (
						<Link
							aria-current={active ? "page" : undefined}
							className={buttonVariants({
								size: "sm",
								variant: active ? "default" : "outline",
							})}
							href={poolHref(tab.value)}
							key={tab.label}
						>
							{tab.label}
						</Link>
					);
				})}
			</nav>

			<div className="flex flex-wrap items-center gap-2">
				<search className="flex flex-1 gap-2">
					<form className="flex flex-1 gap-2" method="get">
						{pool === undefined ? null : (
							<input name="grupo" type="hidden" value={pool} />
						)}
						<div className="relative max-w-xs flex-1">
							<Search
								aria-hidden
								className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								aria-label="Buscar por nome, WhatsApp ou documento"
								className="pl-8"
								defaultValue={search ?? ""}
								name="busca"
								placeholder="Buscar por nome, WhatsApp ou documento"
								type="search"
							/>
						</div>
						<Button type="submit" variant="outline">
							Buscar
						</Button>
					</form>
				</search>

				<a className={buttonVariants()} href={exportHref}>
					<Download />
					Exportar CSV
				</a>
			</div>

			{result.items.length === 0 ? (
				<p className="rounded-xl border border-dashed px-6 py-16 text-center text-muted-foreground text-sm">
					{search
						? `Nenhum participante encontrado para "${search}".`
						: "Nenhum participante cadastrado ainda."}
				</p>
			) : (
				<div className="overflow-hidden rounded-xl border bg-card">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nome</TableHead>
								<TableHead>WhatsApp</TableHead>
								<TableHead>Grupo</TableHead>
								<TableHead>Onde comprou</TableHead>
								<TableHead>CPF/CNPJ</TableHead>
								<TableHead className="text-right">Cadastros</TableHead>
								<TableHead>Data</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{result.items.map((participant) => {
								const data = participant.toSnapshot();

								return (
									<TableRow key={data.id}>
										<TableCell className="font-medium">{data.name}</TableCell>
										<TableCell className="tabular-nums">
											<a
												className="text-primary hover:underline"
												href={`https://wa.me/${data.phone}`}
												rel="noreferrer"
												target="_blank"
											>
												{data.phoneDisplay}
											</a>
										</TableCell>
										<TableCell>
											<Badge
												title={POOL_LABELS[data.pool]}
												variant={data.pool === "cd" ? "default" : "secondary"}
											>
												{POOL_BADGES[data.pool]}
											</Badge>
										</TableCell>
										{/* Loja e cidade na mesma célula: em oito colunas a tabela
										estourava a largura do painel, e a cidade só faz sentido
										junto do nome da loja. */}
										<TableCell>
											<span className="block">{data.storeName}</span>
											<span className="block text-muted-foreground text-xs">
												{data.city} — {data.state}
											</span>
										</TableCell>
										<TableCell className="tabular-nums">
											{data.documentDisplay ?? (
												<span className="text-muted-foreground">—</span>
											)}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{data.participationCount > 1 ? (
												<Badge variant="secondary">
													{data.participationCount}
												</Badge>
											) : (
												data.participationCount
											)}
										</TableCell>
										<TableCell className="tabular-nums">
											<span className="block">
												{dateFormatter.format(data.createdAt)}
											</span>
											<span className="block text-muted-foreground text-xs">
												{timeFormatter.format(data.createdAt)}
											</span>
										</TableCell>
									</TableRow>
								);
							})}
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
