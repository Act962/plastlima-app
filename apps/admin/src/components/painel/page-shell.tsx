import type { ReactNode } from "react";

/** Moldura padrão de uma página do painel: largura, respiro e ritmo verticais. */
export function PageShell({ children }: { children: ReactNode }) {
	return (
		<div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
			{children}
		</div>
	);
}

/** Cabeçalho de página: título, descrição e uma área opcional de ações à direita. */
export function PageHeader({
	title,
	description,
	actions,
}: {
	title: string;
	description?: ReactNode;
	actions?: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-4">
			<div className="space-y-1">
				<h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
				{description ? (
					<p className="text-muted-foreground text-sm">{description}</p>
				) : null}
			</div>
			{actions ? (
				<div className="flex items-center gap-2">{actions}</div>
			) : null}
		</div>
	);
}
