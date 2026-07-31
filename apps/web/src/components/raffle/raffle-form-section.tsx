import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { RAFFLE_CAMPAIGN } from "@/data/raffle";
import { RAFFLE_FORM_ID } from "./constants";
import { RaffleForm } from "./raffle-form";

export function RaffleFormSection() {
	return (
		<Section id={RAFFLE_FORM_ID} tone="muted">
			<Container className="py-section-xs" width="reading">
				<div className="mb-8 text-center">
					<h2 className="type-heading-sm mb-4 font-extrabold">
						{RAFFLE_CAMPAIGN.form.title}
					</h2>
					<p className="mx-auto max-w-[520px] text-[17px] text-body-muted leading-[1.65]">
						{RAFFLE_CAMPAIGN.form.description}
					</p>
				</div>

				<div className="mx-auto max-w-[560px] rounded-[20px] border border-line bg-surface p-[clamp(24px,3vw,36px)]">
					<RaffleForm />
				</div>
			</Container>
		</Section>
	);
}
