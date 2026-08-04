import type { StatContent } from "@plastlima-app/core/schemas";
import { Section } from "@/components/ui/section";

export function StatsBand({ stats }: { stats: StatContent[] }) {
	return (
		<Section tone="yellow">
			<dl className="mx-auto grid w-full max-w-site grid-cols-1 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
				{stats.map((stat) => (
					<div
						/* Divisor só entre colunas: com 2 colunas quem divide são os ímpares;
						   com 4, entram também os pares que não fecham a linha. Sem coluna
						   dupla (mobile) não há divisor nenhum. */
						className="border-on-yellow/15 px-7 pt-11 pb-[46px] sm:odd:border-r lg:even:not-last:border-r"
						key={stat.label}
					>
						<dt className="sr-only">{stat.label}</dt>
						<dd>
							<span className="block font-display font-extrabold text-[42px] text-brand tracking-[-0.03em]">
								{stat.value}
							</span>
							<span className="mt-1.5 block font-semibold text-on-yellow-muted text-sm leading-snug">
								{stat.label}
							</span>
						</dd>
					</div>
				))}
			</dl>
		</Section>
	);
}
