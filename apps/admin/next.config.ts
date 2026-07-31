import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	// Mesma razão do app web: o cliente do Prisma faz require dinâmico e leitura
	// de disco, e sem marcá-lo como externo o rastreio empacota o projeto inteiro.
	serverExternalPackages: ["@prisma/client", "@plastlima-app/infra"],
};

export default nextConfig;
