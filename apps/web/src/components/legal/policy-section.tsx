import type { PolicySection as PolicySectionData } from "@/types/legal";
import { PolicyBlock } from "./policy-block";

/** Uma seção numerada do documento legal: título + blocos de conteúdo. */
export function PolicySection({ section }: { section: PolicySectionData }) {
	return (
		<section className="flex flex-col gap-4" id={section.id}>
			<h2 className="type-heading-sm font-extrabold text-ink">
				{section.title}
			</h2>
			{section.blocks.map((block, index) => (
				<PolicyBlock block={block} key={`${section.id}-${index}`} />
			))}
		</section>
	);
}
