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
