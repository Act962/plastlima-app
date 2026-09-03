import {
	SidebarInset,
	SidebarProvider,
} from "@plastlima-app/ui/components/sidebar";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/painel/app-sidebar";
import { PanelTopbar } from "@/components/painel/panel-topbar";
import { auth } from "@/lib/auth";
import { createListLeads } from "@/lib/leads";

export default async function PainelLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (session === null) {
		redirect("/login");
	}

	// Contador de leads novos no menu. Envolto em try/catch porque um banco fora
	// do ar não pode derrubar todo o painel — o resto das telas trata a própria
	// falha, e aqui a ausência do número é só um menu sem o selo.
	const newLeads = await createListLeads()
		.countNew()
		.catch(() => 0);

	// A sidebar lembra se estava recolhida entre visitas (cookie que ela mesma
	// grava); lê-lo aqui evita o "pisca" de abrir aberta e fechar no cliente.
	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

	const role = (session.user as { role?: string }).role ?? "editor";

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<AppSidebar email={session.user.email} newLeads={newLeads} role={role} />
			{/* `min-w-0`: o inset é um flex item, e sem isso o mínimo automático dele
			é a largura do conteúdo — uma tabela larga empurraria a página inteira
			para os lados em vez de rolar dentro do próprio contêiner. */}
			<SidebarInset className="min-w-0">
				<PanelTopbar />
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}
