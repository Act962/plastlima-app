import { SidebarMenuBadge } from "@plastlima-app/ui/components/sidebar";
import { createListLeads } from "@/lib/leads";

/**
 * Contador de leads novos no menu.
 *
 * Componente próprio, e não um `await` no layout, porque o layout é o caminho
 * de toda navegação do painel: uma consulta ao banco ali atrasa **toda** troca
 * de página. Isolado atrás de um `<Suspense>`, o menu aparece na hora e o número
 * chega depois.
 *
 * O `catch` mantém o painel de pé com o banco fora do ar — a ausência do número
 * é só um menu sem o selo.
 */
export async function NewLeadsBadge() {
	const count = await createListLeads()
		.countNew()
		.catch(() => 0);

	if (count === 0) {
		return null;
	}

	return <SidebarMenuBadge>{count}</SidebarMenuBadge>;
}
