import type { Metadata } from "next";
import { ActionLink } from "@/components/ui/action-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
	title: "Página não encontrada",
	robots: { index: false, follow: true },
};

export default function NotFound() {
	return (
		<Section>
			<Container className="py-section text-center">
				<Eyebrow className="mb-5">Erro 404</Eyebrow>
				<h1 className="type-heading mb-4 font-extrabold">
					Página não encontrada
				</h1>
				<p className="type-lead mx-auto mb-9 max-w-[520px] text-body">
					A página que você procura pode ter sido movida ou não existe mais.
					Volte para o início e continue navegando.
				</p>
				<ActionLink href="/">Voltar para o início</ActionLink>
			</Container>
		</Section>
	);
}
