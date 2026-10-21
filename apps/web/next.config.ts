import "@plastlima-app/env/web";
import type { NextConfig } from "next";

/**
 * Domínio público do R2 (mídia enviada pelo painel). Sem ele, `next/image` recusa
 * as imagens remotas — por isso o site também precisa de `R2_PUBLIC_URL`.
 */
function r2RemotePatterns(): NonNullable<
	NonNullable<NextConfig["images"]>["remotePatterns"]
> {
	const publicUrl = process.env.R2_PUBLIC_URL;

	if (!publicUrl) {
		return [];
	}

	try {
		const url = new URL(publicUrl);
		return [
			{
				protocol: url.protocol === "http:" ? "http" : "https",
				hostname: url.hostname,
			},
		];
	} catch {
		return [];
	}
}

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	images: {
		remotePatterns: r2RemotePatterns(),
	},
	/**
	 * O cliente gerado pelo Prisma faz `require` dinâmico e lê arquivos em disco
	 * para achar o engine. Sem marcá-lo como externo, o rastreio de dependências
	 * do Turbopack conclui que precisa empacotar o projeto inteiro na função.
	 */
	serverExternalPackages: ["@prisma/client", "@plastlima-app/infra"],
	/**
	 * Sorteio fora do ar entre campanhas: o pop-up saiu do layout e qualquer
	 * acesso a `/sorteio` (cadastro, confirmação, regulamento e a Server Action)
	 * volta para a home. O código da campanha continua em `app/sorteio` e
	 * `components/raffle` para a próxima — reativar é remover este redirect,
	 * devolver `<RafflePopup />` ao layout e as rotas ao `sitemap.ts`.
	 * Temporário (307) de propósito, para o navegador não memorizar o desvio.
	 */
	async redirects() {
		return [
			{ source: "/sorteio", destination: "/", permanent: false },
			{ source: "/sorteio/:path*", destination: "/", permanent: false },
		];
	},
};

export default nextConfig;
