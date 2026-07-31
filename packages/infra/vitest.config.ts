import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globalSetup: ["./src/testing/global-setup.ts"],
		// Baixar e subir o mongod na primeira execução leva bem mais que o padrão.
		testTimeout: 60_000,
		hookTimeout: 180_000,
		// Há um único banco compartilhado: arquivos em paralelo disputariam as
		// mesmas coleções e o resultado dependeria da ordem.
		fileParallelism: false,
	},
});
