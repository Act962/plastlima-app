import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { EXTERNAL_LINKS } from "@/data/site";
import { ContactDetails } from "./contact-details";
import { ContactForm } from "./contact-form";

export function ContactSection() {
	return (
		<Section>
			<Container className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] items-start gap-[clamp(36px,4vw,64px)] pt-[clamp(44px,6vw,72px)] pb-[clamp(64px,9vw,112px)]">
				<div className="rounded-[20px] border border-line bg-surface p-[clamp(24px,3vw,36px)]">
					<ContactForm />
				</div>

				<div className="flex flex-col gap-5">
					<div className="overflow-hidden rounded-[20px] border border-line bg-surface">
						<iframe
							className="block h-[300px] w-full border-0"
							loading="lazy"
							src={EXTERNAL_LINKS.headquartersMap}
							title="Centro de Distribuição Plastlima"
						/>
					</div>
					<ContactDetails />
				</div>
			</Container>
		</Section>
	);
}
