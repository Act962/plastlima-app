import { resolvePolicyTokens } from "@plastlima-app/core/schemas";
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { JsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/ui/page-hero";
import { getPrivacyPolicyContent } from "@/lib/content/privacy-policy";
import { getSiteContent } from "@/lib/content/site";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = buildPageMetadata({
	title: "Política de Privacidade",
	description:
		"Saiba como a Plastlima coleta, utiliza e protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD).",
	path: "/politica-de-privacidade",
});

export default async function PrivacyPolicyPage() {
	const [policy, site] = await Promise.all([
		getPrivacyPolicyContent(),
		getSiteContent(),
	]);

	const document = resolvePolicyTokens(policy, {
		"site.name": site.name,
		"site.address": site.address,
		"site.email": site.email,
		"site.franchiseEmail": site.franchiseEmail,
		"contact.support.display": site.contact.support.display,
	});

	return (
		<>
			<JsonLd
				data={breadcrumbSchema([
					{ name: "Início", path: "/" },
					{ name: "Política de Privacidade", path: "/politica-de-privacidade" },
				])}
			/>
			<PageHero eyebrow="Privacidade" title="Política de Privacidade" />
			<LegalDocument document={document} />
		</>
	);
}
