import { POOL_LABELS, type RafflePool } from "@plastlima-app/core";
import { auth } from "@/lib/auth";
import { toCsv, withUtf8Bom } from "@/lib/csv";
import { createListParticipants } from "@/lib/participants";

/** Teto de linhas por exportação, alinhado ao limite do caso de uso. */
const EXPORT_LIMIT = 5000;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
	dateStyle: "short",
	timeStyle: "short",
	timeZone: "America/Fortaleza",
});

export async function GET(request: Request): Promise<Response> {
	const session = await auth.api.getSession({ headers: request.headers });

	if (session === null) {
		return new Response("Não autorizado", { status: 401 });
	}

	const query = new URL(request.url).searchParams;
	const search = query.get("busca") ?? undefined;
	const grupo = query.get("grupo");
	// A exportação respeita o mesmo recorte da tela: quem filtrou por grupo para
	// conduzir uma apuração não quer levar o outro grupo junto na planilha.
	const pool: RafflePool | undefined =
		grupo === "cd" || grupo === "unidades" ? grupo : undefined;

	const result = await createListParticipants().execute({
		pool,
		search,
		page: 1,
		pageSize: EXPORT_LIMIT,
	});

	const rows = result.items.map((participant) => {
		const data = participant.toSnapshot();

		return [
			data.name,
			data.phoneDisplay,
			data.phone,
			POOL_LABELS[data.pool],
			data.storeName,
			data.city,
			data.state,
			data.documentDisplay ?? "",
			String(data.participationCount),
			dateFormatter.format(data.createdAt),
		];
	});

	// O grupo vai na planilha mesmo quando o filtro já o restringe: o arquivo
	// circula fora do painel, e a ata da apuração precisa dizer de qual sorteio
	// aquela lista é.
	const csv = toCsv(
		[
			"Nome",
			"WhatsApp",
			"WhatsApp (E.164)",
			"Grupo",
			"Loja",
			"Cidade",
			"Estado",
			"CPF/CNPJ",
			"Cadastros",
			"Data do cadastro",
		],
		rows,
	);

	if (result.total > EXPORT_LIMIT) {
		console.warn(
			`[exportar] ${result.total} participantes, exportados os ${EXPORT_LIMIT} mais recentes`,
		);
	}

	return new Response(withUtf8Bom(csv), {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": 'attachment; filename="participantes-sorteio.csv"',
			"Cache-Control": "no-store",
		},
	});
}
