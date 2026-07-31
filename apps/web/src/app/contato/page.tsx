import type { Metadata } from "next";
import { ContactSection } from "@/components/contact/contact-section";
import { JsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/ui/page-hero";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = buildPageMetadata({
	title: "Contato e atendimento",
	description:
		"Fale com a Plastlima: WhatsApp, e-mail e endereço do centro de distribuição em Teresina-PI. Tire dúvidas, envie sugestões ou fale com o atendimento.",
	path: "/contato",
});

export default function ContactPage() {
	return (
		<>
			<JsonLd
				data={breadcrumbSchema([
					{ name: "Início", path: "/" },
					{ name: "Contato", path: "/contato" },
				])}
			/>
			<PageHero
				description="Preencha o Formulário para dúvidas, sugestões e/ou reclamações."
				eyebrow="Contato"
				title="Nossos Contatos"
			/>
			<ContactSection />
		</>
	);
}
