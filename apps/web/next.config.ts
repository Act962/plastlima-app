import "@plastlima-app/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	/**
	 * O cliente gerado pelo Prisma faz `require` dinâmico e lê arquivos em disco
	 * para achar o engine. Sem marcá-lo como externo, o rastreio de dependências
	 * do Turbopack conclui que precisa empacotar o projeto inteiro na função.
	 */
	serverExternalPackages: ["@prisma/client", "@plastlima-app/infra"],
};

export default nextConfig;
