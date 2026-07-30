import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { COMPANY_TIMELINE } from "@/data/franchise";

export function CompanyTimeline() {
	return (
		<Section>
			<Container className="py-section">
				<h2 className="type-heading mb-14 font-extrabold">
					Nossa trajetória até aqui
				</h2>
				<ol className="grid grid-cols-[repeat(auto-fit,minmax(min(430px,100%),1fr))]">
					{COMPANY_TIMELINE.map((entry) => (
						<li
							className="flex gap-6 border-line border-t py-7 pr-8"
							key={entry.year}
						>
							<span className="min-w-[56px] pt-[3px] font-display font-extrabold text-[15px] text-brand tracking-[0.02em]">
								{entry.year}
							</span>
							<p className="text-[16px] text-body leading-[1.62]">
								{entry.description}
							</p>
						</li>
					))}
				</ol>
			</Container>
		</Section>
	);
}
