import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { CONTACT, SITE } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { FRANCHISE_FORM_ID } from "./constants";
import { FranchiseLeadForm } from "./franchise-lead-form";

export function FranchiseFormSection() {
	return (
		<Section border="top" id={FRANCHISE_FORM_ID} tone="muted">
			<Container className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-[clamp(40px,5vw,72px)] py-section">
				<div>
					<h2 className="type-heading-sm mb-5 font-extrabold">
						Preencha o formulário abaixo e seja um franqueado
					</h2>
					<p className="mb-7 text-[17px] text-body-muted leading-[1.65]">
						Nossa equipe entra em contato para apresentar o modelo de negócio,
						investimento e territórios disponíveis.
					</p>
					<div className="flex flex-col gap-2.5 border-line-strong border-t pt-6">
						<p className="font-bold text-[12px] text-label uppercase tracking-[0.06em]">
							Fale diretamente com um consultor
						</p>
						<a
							className="w-fit font-display font-extrabold text-[26px] text-ink tracking-[-0.02em] transition-colors hover:text-brand"
							href={whatsappUrl(CONTACT.franchise.phone)}
							rel="noreferrer"
							target="_blank"
						>
							{CONTACT.franchise.display}
						</a>
						<a
							className="w-fit text-[15.5px] text-body-muted transition-colors hover:text-brand"
							href={`mailto:${SITE.franchiseEmail}`}
						>
							{SITE.franchiseEmail}
						</a>
					</div>
				</div>

				<div className="rounded-[20px] border border-line bg-surface p-[clamp(24px,3vw,36px)]">
					<FranchiseLeadForm />
				</div>
			</Container>
		</Section>
	);
}
