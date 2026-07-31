import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { TestProject } from "vitest/node";

declare module "vitest" {
	export interface ProvidedContext {
		databaseUrl: string;
	}
}

/**
 * Banco de teste, separado do de desenvolvimento apenas pelo nome — os dois
 * vivem no mesmo container do docker-compose. Assim os testes podem limpar as
 * coleções à vontade sem apagar o que você cadastrou testando na mão.
 */
const DEFAULT_TEST_DATABASE_URL =
	"mongodb://localhost:27017/plastlima_test?replicaSet=rs0";

const packageRoot = fileURLToPath(new URL("../..", import.meta.url));

/**
 * Prepara o banco dos testes de integração.
 *
 * O `prisma db push` roda aqui porque é ele quem cria o índice único — sem essa
 * etapa, o teste de duplicata passaria por acidente.
 */
export function setup(project: TestProject): void {
	const databaseUrl =
		process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;

	try {
		execSync("pnpm exec prisma db push --skip-generate", {
			cwd: packageRoot,
			env: { ...process.env, DATABASE_URL: databaseUrl },
			stdio: "inherit",
		});
	} catch (error) {
		throw new Error(
			"Não foi possível preparar o banco de teste.\n" +
				"Os testes de integração precisam do MongoDB do docker-compose:\n\n" +
				"  pnpm run db:up\n\n" +
				`URL usada: ${databaseUrl}\n` +
				"(defina TEST_DATABASE_URL para apontar para outro servidor)",
			{ cause: error },
		);
	}

	project.provide("databaseUrl", databaseUrl);
}
