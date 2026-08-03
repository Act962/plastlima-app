import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { JsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/ui/page-hero";
import { PRIVACY_POLICY } from "@/data/privacy-policy";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = buildPageMetadata({
	title: "Política de Privacidade",
	description:
		"Saiba como a Plastlima coleta, utiliza e protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD).",
	path: "/politica-de-privacidade",
});

export default function PrivacyPolicyPage() {
	return (
		<>
			<JsonLd
				data={breadcrumbSchema([
					{ name: "Início", path: "/" },
					{ name: "Política de Privacidade", path: "/politica-de-privacidade" },
				])}
			/>
			<PageHero eyebrow="Privacidade" title="Política de Privacidade" />
			<LegalDocument document={PRIVACY_POLICY} />
		</>
	);
}
