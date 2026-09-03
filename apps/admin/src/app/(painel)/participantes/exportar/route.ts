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

	const search = new URL(request.url).searchParams.get("busca") ?? undefined;

	const result = await createListParticipants().execute({
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
			data.storeName,
			data.city,
			data.state,
			data.receiptImage === null ? "não" : "sim",
			String(data.participationCount),
			dateFormatter.format(data.createdAt),
		];
	});

	// A coluna do cupom é apenas sim/não: a imagem em base64 tornaria o arquivo
	// inabrível no Excel. Para conferir o cupom, use a miniatura no painel.
	const csv = toCsv(
		[
			"Nome",
			"WhatsApp",
			"WhatsApp (E.164)",
			"Loja",
			"Cidade",
			"Estado",
			"Enviou cupom",
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
