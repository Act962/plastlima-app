import { getPrisma } from "@plastlima-app/infra";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

/**
 * Autenticação do painel.
 *
 * `disableSignUp` é o ponto mais importante daqui: não existe cadastro público.
 * Contas são criadas pelo seed (`pnpm run seed:admin`), o que evita que qualquer
 * pessoa que descubra a URL crie acesso aos dados dos participantes.
 */
export const auth = betterAuth({
	database: prismaAdapter(getPrisma(), { provider: "mongodb" }),
	emailAndPassword: {
		enabled: true,
		disableSignUp: true,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		/**
		 * A sessão vai assinada num cookie curto, então validar não custa uma ida
		 * ao banco. Importa porque *toda* página e action do painel chama
		 * `getSession` — no serverless da Vercel, com o Mongo no Atlas, era uma
		 * viagem de rede antes de qualquer consulta útil da tela.
		 *
		 * O preço é a revogação: encerrar uma sessão só faz efeito em outro
		 * dispositivo quando o cache expira. Cinco minutos é o compromisso — se um
		 * dia for preciso cortar acesso na hora, baixe o `maxAge` ou passe
		 * `disableCookieCache` na chamada sensível.
		 */
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},
	advanced: {
		database: {
			// O Better Auth gera ids alfanuméricos próprios, que o Mongo rejeita nos
			// campos `@db.ObjectId`. Desligando, o id passa a ser gerado pelo banco.
			generateId: false,
		},
	},
	user: {
		additionalFields: {
			role: { type: "string", required: false, input: false },
		},
	},
});
