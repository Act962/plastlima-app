import { defineConfig } from "vitest/config";

/**
 * Configuração base do Vitest, compartilhada pelos pacotes testáveis.
 *
 * Concentra o que é comum — o provider de cobertura e o que dela excluir — para
 * cada pacote só declarar o que é seu (o `globalSetup` do Mongo em `infra`, por
 * exemplo). Cada consumidor faz `mergeConfig(baseVitestConfig, ...)`.
 *
 * Não há threshold global de cobertura de propósito (spec §9): a meta alta vale
 * só para `packages/core`, que é puro e determinístico. Impor um número no
 * monorepo inteiro forçaria teste de baixo valor em código de adaptação.
 */
export const baseVitestConfig = defineConfig({
	test: {
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			include: ["src/**/*.ts"],
			// Não faz sentido cobrir o que não é lógica: os próprios testes, os
			// dublês de teste e o barril de exportações.
			exclude: ["src/**/*.test.ts", "src/testing/**", "src/index.ts"],
		},
	},
});
