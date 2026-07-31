import { PrismaClient } from "@prisma/client";

export { PrismaClient };

/**
 * Cria um cliente apontando para uma URL específica.
 *
 * Usado pelos testes de integração, que sobem um MongoDB efêmero e precisam
 * conectar nele em vez de no banco do ambiente.
 */
export function createPrismaClient(datasourceUrl?: string): PrismaClient {
	return new PrismaClient(
		datasourceUrl === undefined ? undefined : { datasourceUrl },
	);
}

const globalForPrisma = globalThis as unknown as {
	__plastlimaPrisma?: PrismaClient;
};

/**
 * Instância compartilhada da aplicação, criada sob demanda.
 *
 * É preguiçosa de propósito: instanciar no topo do módulo faria o `next build`
 * exigir `DATABASE_URL` para gerar páginas que nem tocam o banco. O cache no
 * escopo global existe porque o hot reload do Next reavalia os módulos a cada
 * alteração, e um cliente novo por reload esgota o pool de conexões.
 */
export function getPrisma(): PrismaClient {
	const cached = globalForPrisma.__plastlimaPrisma;

	if (cached !== undefined) {
		return cached;
	}

	const client = createPrismaClient();

	if (process.env.NODE_ENV !== "production") {
		globalForPrisma.__plastlimaPrisma = client;
	}

	return client;
}
