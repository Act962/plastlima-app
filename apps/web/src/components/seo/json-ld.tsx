type JsonLdProps = {
	/** Um ou mais objetos schema.org serializados em <script type="application/ld+json">. */
	data: object | object[];
};

/**
 * Injeta dados estruturados. O conteúdo vem de constantes do próprio projeto
 * (sem entrada do usuário); ainda assim escapamos "<" para não permitir que uma
 * string feche o <script> prematuramente.
 */
export function JsonLd({ data }: JsonLdProps) {
	const json = JSON.stringify(data).replace(/</g, "\\u003c");

	return (
		<script
			dangerouslySetInnerHTML={{ __html: json }}
			type="application/ld+json"
		/>
	);
}
