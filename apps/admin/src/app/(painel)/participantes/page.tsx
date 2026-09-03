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
import { ReceiptThumbnail } from "@/components/receipt-thumbnail";
import { requireActor } from "@/lib/auth-actor";
import { createListParticipants } from "@/lib/participants";

export const metadata: Metadata = { title: "Participantes" };

const PAGE_SIZE = 25;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
	dateStyle: "short",
	timeStyle: "short",
	timeZone: "America/Fortaleza",
});

type PageProps = {
	searchParams: Promise<{ busca?: string; pagina?: string }>;
};

export default async function ParticipantsPage({ searchParams }: PageProps) {
	await requireActor();

	const { busca, pagina } = await searchParams;
	const search = busca?.trim() || undefined;
	const page = Math.max(1, Number.parseInt(pagina ?? "1", 10) || 1);

	const result = await createListParticipants().execute({
		search,
		page,
		pageSize: PAGE_SIZE,
	});

	const lastPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
	const exportHref = search
		? `/participantes/exportar?busca=${encodeURIComponent(search)}`
		: "/participantes/exportar";
	const pageHref = (target: number): Route =>
		`/participantes?pagina=${target}${search ? `&busca=${encodeURIComponent(search)}` : ""}` as Route;

	return (
		<PageShell>
			<PageHeader
				description={`Sorteio Kit Churrasco — ${result.total} ${result.total === 1 ? "inscrito" : "inscritos"}.`}
				title="Participantes"
			/>

			<div className="flex flex-wrap items-center gap-2">
				<search className="flex flex-1 gap-2">
					<form className="flex flex-1 gap-2" method="get">
						<div className="relative max-w-xs flex-1">
							<Search
								aria-hidden
								className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								aria-label="Buscar por nome ou WhatsApp"
								className="pl-8"
								defaultValue={search ?? ""}
								name="busca"
								placeholder="Buscar por nome ou WhatsApp"
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
								<TableHead>Loja</TableHead>
								<TableHead>Cidade</TableHead>
								<TableHead>Cupom</TableHead>
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
										<TableCell>{data.storeName}</TableCell>
										<TableCell className="text-muted-foreground">
											{data.city} — {data.state}
										</TableCell>
										<TableCell>
											{data.receiptImage === null ? (
												<span className="text-muted-foreground">—</span>
											) : (
												<ReceiptThumbnail
													dataUrl={data.receiptImage}
													participantName={data.name}
												/>
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
										<TableCell className="text-muted-foreground tabular-nums">
											{dateFormatter.format(data.createdAt)}
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
