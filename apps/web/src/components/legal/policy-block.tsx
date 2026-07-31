import type { PolicyBlock as PolicyBlockData } from "@/types/legal";

/** Renderiza um bloco de conteúdo legal: parágrafo ou lista. */
export function PolicyBlock({ block }: { block: PolicyBlockData }) {
	if (block.type === "paragraph") {
		return <p className="type-body-lg text-body-muted">{block.text}</p>;
	}

	return (
		<div className="flex flex-col gap-3.5">
			{block.lead ? (
				<p className="type-body-lg text-body-muted">{block.lead}</p>
			) : null}
			<ul className="flex flex-col gap-2.5">
				{block.items.map((item) => (
					<li
						className="type-body-lg flex gap-3 text-body-muted"
						key={item}
					>
						<span
							aria-hidden
							className="mt-[10px] size-1.5 shrink-0 rounded-full bg-brand"
						/>
						<span>{item}</span>
					</li>
				))}
			</ul>
		</div>
	);
}
