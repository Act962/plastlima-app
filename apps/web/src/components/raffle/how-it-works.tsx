import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { RAFFLE_CAMPAIGN } from "@/data/raffle";

export function HowItWorks() {
	return (
		<Section border="bottom" tone="surface">
			<Container className="py-section-xs">
				<Eyebrow className="mb-[18px]">Como participar</Eyebrow>
				<h2 className="type-heading-sm mb-10 max-w-[620px] font-extrabold">
					Quatro passos e você já está concorrendo
				</h2>

				<ol className="grid list-none grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-5">
					{RAFFLE_CAMPAIGN.steps.map((step, index) => (
						<li
							className="flex flex-col rounded-[20px] border border-line bg-canvas p-6"
							key={step.id}
						>
							<span
								aria-hidden
								className="mb-4 flex size-10 items-center justify-center rounded-full bg-brand font-display font-extrabold text-[17px] text-white"
							>
								{index + 1}
							</span>
							<h3 className="mb-2 font-display font-extrabold text-[19px] text-ink">
								{step.title}
							</h3>
							<p className="text-[15.5px] text-body-muted leading-[1.6]">
								{step.description}
							</p>
						</li>
					))}
				</ol>
			</Container>
		</Section>
	);
}
