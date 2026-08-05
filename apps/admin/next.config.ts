import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	// Mesma razão do app web: o cliente do Prisma faz require dinâmico e leitura
	// de disco, e sem marcá-lo como externo o rastreio empacota o projeto inteiro.
	serverExternalPackages: ["@prisma/client", "@plastlima-app/infra"],
	experimental: {
		// O upload de mídia passa o arquivo por uma Server Action, e o padrão do
		// Next é 1 MB. Elevamos para acomodar o limite de 5 MB por imagem (com folga
		// para o overhead do multipart e o campo de texto alternativo).
		serverActions: {
			bodySizeLimit: "6mb",
		},
	},
};

export default nextConfig;
