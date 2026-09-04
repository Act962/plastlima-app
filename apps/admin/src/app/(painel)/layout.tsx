import {
	SidebarInset,
	SidebarProvider,
} from "@plastlima-app/ui/components/sidebar";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppSidebar } from "@/components/painel/app-sidebar";
import { NewLeadsBadge } from "@/components/painel/new-leads-badge";
import { PanelTopbar } from "@/components/painel/panel-topbar";
import { auth } from "@/lib/auth";

export default async function PainelLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (session === null) {
		redirect("/login");
	}

	// A sidebar lembra se estava recolhida entre visitas (cookie que ela mesma
	// grava); lê-lo aqui evita o "pisca" de abrir aberta e fechar no cliente.
	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

	const role = (session.user as { role?: string }).role ?? "editor";

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			{/* O contador de leads entra como slot, atrás de Suspense: é a única
			consulta ao banco que havia neste layout, e o layout está no caminho de
			toda navegação — esperá-la aqui atrasava a troca de qualquer página. */}
			<AppSidebar
				email={session.user.email}
				leadsBadge={
					<Suspense fallback={null}>
						<NewLeadsBadge />
					</Suspense>
				}
				role={role}
			/>
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
