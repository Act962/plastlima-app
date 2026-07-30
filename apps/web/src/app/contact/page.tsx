import type { Metadata } from "next";
import { ContactSection } from "@/components/contact/contact-section";
import { PageHero } from "@/components/ui/page-hero";

export const metadata: Metadata = {
	title: "Contato",
	description:
		"Fale com a PlastLima: endereço do centro de distribuição, WhatsApp, e-mail e formulário de contato.",
};

export default function ContactPage() {
	return (
		<>
			<PageHero
				description="Preencha o Formulário para dúvidas, sugestões e/ou reclamações."
				eyebrow="Contato"
				title="Nossos Contatos"
			/>
			<ContactSection />
		</>
	);
}
