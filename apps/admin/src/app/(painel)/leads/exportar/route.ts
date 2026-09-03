import type { LeadKind, LeadStatus } from "@plastlima-app/core";
import { auth } from "@/lib/auth";
import { toCsv, withUtf8Bom } from "@/lib/csv";
import { createListLeads } from "@/lib/leads";

/** Teto de linhas por exportação, alinhado ao limite do caso de uso. */
const EXPORT_LIMIT = 5000;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
	dateStyle: "short",
	timeStyle: "short",
	timeZone: "America/Fortaleza",
});

const KIND_LABELS: Record<LeadKind, string> = {
	contact: "Contato",
	franchise: "Franquia",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
	new: "Novo",
	handled: "Atendido",
};

export async function GET(request: Request): Promise<Response> {
	const session = await auth.api.getSession({ headers: request.headers });

	if (session === null) {
		return new Response("Não autorizado", { status: 401 });
	}

	// Os mesmos filtros da tela: quem exporta espera o arquivo do que está vendo,
	// não a caixa inteira.
	const params = new URL(request.url).searchParams;

	const result = await createListLeads().execute({
		search: params.get("busca") ?? undefined,
		kind: toKind(params.get("origem")),
		status: toStatus(params.get("situacao")),
		page: 1,
		pageSize: EXPORT_LIMIT,
	});

	const rows = result.items.map((lead) => {
		const data = lead.toSnapshot();

		return [
			KIND_LABELS[data.kind],
			data.name,
			data.email,
			data.phone ?? "",
			data.city ?? "",
			data.state ?? "",
			data.message ?? "",
			STATUS_LABELS[data.status],
			data.handledBy ?? "",
			dateFormatter.format(data.createdAt),
		];
	});

	const csv = toCsv(
		[
			"Origem",
			"Nome",
			"E-mail",
			"Telefone",
			"Cidade",
			"Estado",
			"Mensagem",
			"Situação",
			"Atendido por",
			"Recebido em",
		],
		rows,
	);

	if (result.total > EXPORT_LIMIT) {
		console.warn(
			`[leads] ${result.total} leads, exportados os ${EXPORT_LIMIT} mais recentes`,
		);
	}

	return new Response(withUtf8Bom(csv), {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": 'attachment; filename="leads.csv"',
			"Cache-Control": "no-store",
		},
	});
}

function toKind(value: string | null): LeadKind | undefined {
	return value === "contact" || value === "franchise" ? value : undefined;
}

function toStatus(value: string | null): LeadStatus | undefined {
	return value === "new" || value === "handled" ? value : undefined;
}
