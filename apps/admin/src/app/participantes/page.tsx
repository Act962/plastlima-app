import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReceiptThumbnail } from "@/components/receipt-thumbnail";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";
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
	const session = await auth.api.getSession({ headers: await headers() });

	if (session === null) {
		redirect("/login");
	}

	const { busca, pagina } = await searchParams;
	const page = Math.max(1, Number.parseInt(pagina ?? "1", 10) || 1);

	const result = await createListParticipants().execute({
		search: busca,
		page,
		pageSize: PAGE_SIZE,
	});

	const lastPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
	const exportHref = busca
		? `/participantes/exportar?busca=${encodeURIComponent(busca)}`
		: "/participantes/exportar";

	return (
		<main className="mx-auto w-full max-w-6xl px-5 py-10">
			<header className="mb-8 flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Participantes</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Sorteio Kit Churrasco — {result.total}{" "}
						{result.total === 1 ? "inscrito" : "inscritos"}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-sm">
						{session.user.email}
					</span>
					<SignOutButton />
				</div>
			</header>

			<div className="mb-5 flex flex-wrap items-center gap-3">
				<form className="flex flex-1 gap-2" method="get">
					<input
						aria-label="Buscar por nome ou WhatsApp"
						className="w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
						defaultValue={busca ?? ""}
						name="busca"
						placeholder="Buscar por nome ou WhatsApp"
						type="search"
					/>
					<button
						className="cursor-pointer rounded-lg border border-border px-3 py-2 font-medium text-sm transition-colors hover:bg-muted"
						type="submit"
					>
						Buscar
					</button>
				</form>

				<a
					className="cursor-pointer rounded-lg bg-brand px-4 py-2 font-semibold text-sm text-white transition-colors hover:bg-brand-dark"
					href={exportHref}
				>
					Exportar CSV
				</a>
			</div>

			{result.items.length === 0 ? (
				<p className="rounded-xl border border-border border-dashed px-6 py-16 text-center text-muted-foreground text-sm">
					{busca
						? `Nenhum participante encontrado para "${busca}".`
						: "Nenhum participante cadastrado ainda."}
				</p>
			) : (
				<div className="overflow-x-auto rounded-xl border border-border">
					<table className="w-full min-w-[820px] border-collapse text-sm">
						<thead className="bg-muted/50 text-left">
							<tr>
								<th className="px-4 py-3 font-semibold">Nome</th>
								<th className="px-4 py-3 font-semibold">WhatsApp</th>
								<th className="px-4 py-3 font-semibold">Loja</th>
								<th className="px-4 py-3 font-semibold">Cidade</th>
								<th className="px-4 py-3 font-semibold">Cupom</th>
								<th className="px-4 py-3 text-right font-semibold">
									Cadastros
								</th>
								<th className="px-4 py-3 font-semibold">Data</th>
							</tr>
						</thead>
						<tbody>
							{result.items.map((participant) => {
								const data = participant.toSnapshot();

								return (
									<tr className="border-border border-t" key={data.id}>
										<td className="px-4 py-3 font-medium">{data.name}</td>
										<td className="px-4 py-3 tabular-nums">
											<a
												className="hover:text-brand hover:underline"
												href={`https://wa.me/${data.phone}`}
												rel="noreferrer"
												target="_blank"
											>
												{data.phoneDisplay}
											</a>
										</td>
										<td className="px-4 py-3">{data.storeName}</td>
										<td className="px-4 py-3 text-muted-foreground">
											{data.city} — {data.state}
										</td>
										<td className="px-4 py-3">
											{data.receiptImage === null ? (
												<span className="text-muted-foreground">—</span>
											) : (
												<ReceiptThumbnail
													dataUrl={data.receiptImage}
													participantName={data.name}
												/>
											)}
										</td>
										<td className="px-4 py-3 text-right tabular-nums">
											{data.participationCount}
										</td>
										<td className="px-4 py-3 text-muted-foreground tabular-nums">
											{dateFormatter.format(data.createdAt)}
										</td>
									</tr>
								);
							})}
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
								href={`/participantes?pagina=${page - 1}${busca ? `&busca=${encodeURIComponent(busca)}` : ""}`}
							>
								Anterior
							</Link>
						) : null}
						{page < lastPage ? (
							<Link
								className="rounded-lg border border-border px-3 py-1.5 transition-colors hover:bg-muted"
								href={`/participantes?pagina=${page + 1}${busca ? `&busca=${encodeURIComponent(busca)}` : ""}`}
							>
								Próxima
							</Link>
						) : null}
					</div>
				</nav>
			) : null}
		</main>
	);
}
