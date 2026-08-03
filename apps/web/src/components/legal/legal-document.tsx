import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import type { LegalDocument as LegalDocumentData } from "@/types/legal";
import { PolicySection } from "./policy-section";

/** Renderiza um documento legal completo em coluna de leitura confortável. */
export function LegalDocument({ document }: { document: LegalDocumentData }) {
	return (
		<Section>
			<Container className="py-[clamp(48px,6.5vw,80px)]" width="reading">
				<p className="type-eyebrow mb-8 text-body-muted">
					Última atualização: {document.updatedAt}
				</p>

				<div className="mb-12 flex flex-col gap-4">
					{document.intro.map((paragraph) => (
						<p className="type-lead text-body" key={paragraph}>
							{paragraph}
						</p>
					))}
				</div>

				<div className="flex flex-col gap-12">
					{document.sections.map((section) => (
						<PolicySection key={section.id} section={section} />
					))}
				</div>
			</Container>
		</Section>
	);
}
