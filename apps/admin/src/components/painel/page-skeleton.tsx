import { Skeleton } from "@plastlima-app/ui/components/skeleton";
import { PageShell } from "./page-shell";

/**
 * Esqueleto de carregamento de qualquer tela do painel.
 *
 * Existe menos pela aparência e mais pela navegação: sem um `loading` como
 * fronteira de Suspense, o Next só consegue pré-carregar rotas dinâmicas até
 * onde houver uma — ou seja, nada — e o clique no menu fica **bloqueado** na
 * página antiga até o servidor responder, sem nenhum sinal de que algo
 * aconteceu. Com este arquivo a navegação troca na hora e a espera acontece
 * aqui, visível.
 *
 * Serve todas as rotas do grupo `(painel)`; uma tela com forma muito diferente
 * pode ganhar o próprio `loading.tsx` na pasta dela.
 */
export function PanelPageSkeleton() {
	return (
		<PageShell>
			<div className="space-y-2">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-4 w-80" />
			</div>

			<div className="flex gap-2">
				<Skeleton className="h-9 w-64" />
				<Skeleton className="h-9 w-28" />
			</div>

			<div className="space-y-2 rounded-xl border bg-card p-4">
				{/* Chaves fixas: a lista é estática e não reordena. */}
				{["a", "b", "c", "d", "e", "f"].map((row) => (
					<Skeleton className="h-11 w-full" key={row} />
				))}
			</div>
		</PageShell>
	);
}
