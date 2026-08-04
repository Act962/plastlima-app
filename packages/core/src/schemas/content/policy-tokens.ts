import type { PrivacyPolicyContent } from "./privacy-policy";

/**
 * Tokens da Política de Privacidade (spec §7.3). O texto guarda `{{site.email}}`
 * etc.; a substituição pelos valores reais acontece na renderização, com os
 * dados do documento `site`. Editar as Configurações reflete na política.
 */
export const POLICY_TOKENS = [
	{ token: "site.name", label: "Nome da empresa" },
	{ token: "site.address", label: "Endereço" },
	{ token: "site.email", label: "E-mail de contato" },
	{ token: "site.franchiseEmail", label: "E-mail de franquias" },
	{ token: "contact.support.display", label: "Telefone/WhatsApp de suporte" },
] as const;

export type PolicyTokenKey = (typeof POLICY_TOKENS)[number]["token"];
export type PolicyTokenValues = Record<PolicyTokenKey, string>;

const TOKEN_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;
const KNOWN_TOKENS = new Set<string>(POLICY_TOKENS.map((entry) => entry.token));

/**
 * Troca `{{token}}` pelos valores informados. Token desconhecido é deixado como
 * está — a validação de tokens é responsabilidade do editor, não da renderização.
 */
export function renderPolicyTokens(
	text: string,
	values: PolicyTokenValues,
): string {
	return text.replace(TOKEN_PATTERN, (match, key: string) =>
		key in values ? values[key as PolicyTokenKey] : match,
	);
}

/** Tokens presentes no texto que não existem (para o editor avisar). */
export function findUnknownPolicyTokens(text: string): string[] {
	const unknown = new Set<string>();
	for (const match of text.matchAll(TOKEN_PATTERN)) {
		const key = match[1];
		if (key !== undefined && !KNOWN_TOKENS.has(key)) {
			unknown.add(key);
		}
	}
	return [...unknown];
}

/** Aplica os tokens a todo o documento, devolvendo uma cópia já resolvida. */
export function resolvePolicyTokens(
	content: PrivacyPolicyContent,
	values: PolicyTokenValues,
): PrivacyPolicyContent {
	const render = (text: string) => renderPolicyTokens(text, values);

	return {
		updatedAt: render(content.updatedAt),
		intro: content.intro.map(render),
		sections: content.sections.map((section) => ({
			...section,
			title: render(section.title),
			blocks: section.blocks.map((block) =>
				block.type === "paragraph"
					? { ...block, text: render(block.text) }
					: {
							...block,
							lead: block.lead === undefined ? undefined : render(block.lead),
							items: block.items.map(render),
						},
			),
		})),
	};
}
