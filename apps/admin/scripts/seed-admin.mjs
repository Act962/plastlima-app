/**
 * Cria (ou atualiza a senha de) um usuário do painel.
 *
 * Existe porque o cadastro público está desligado no Better Auth
 * (`disableSignUp`) — a única forma de nascer um acesso é aqui, com alguém que
 * já tem o banco em mãos.
 *
 * Uso:
 *   pnpm run seed:admin -- --email=fulano@plastlima.com.br --senha='...' --nome='Fulano'
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const MIN_PASSWORD_LENGTH = 12;

function readArg(name) {
	const prefix = `--${name}=`;
	const match = process.argv.find((arg) => arg.startsWith(prefix));

	return match === undefined ? undefined : match.slice(prefix.length);
}

const email = readArg("email");
const password = readArg("senha");
const name = readArg("nome") ?? "Equipe Plastlima";
const role = readArg("papel") ?? "owner";

if (email === undefined || password === undefined) {
	console.error(
		"Uso: pnpm run seed:admin -- --email=<e-mail> --senha=<senha> [--nome=<nome>] [--papel=owner|editor]",
	);
	process.exit(1);
}

if (password.length < MIN_PASSWORD_LENGTH) {
	console.error(
		`A senha precisa de ao menos ${MIN_PASSWORD_LENGTH} caracteres.`,
	);
	process.exit(1);
}

const prisma = new PrismaClient();

try {
	const hash = await hashPassword(password);

	const user = await prisma.user.upsert({
		where: { email },
		create: { email, name, role, emailVerified: true },
		update: { name, role },
	});

	// O provider "credential" é o que o Better Auth procura no login por senha.
	const existing = await prisma.account.findFirst({
		where: { userId: user.id, providerId: "credential" },
	});

	if (existing === null) {
		await prisma.account.create({
			data: {
				userId: user.id,
				accountId: user.id,
				providerId: "credential",
				password: hash,
			},
		});
	} else {
		await prisma.account.update({
			where: { id: existing.id },
			data: { password: hash },
		});
	}

	console.info(`Acesso pronto para ${email} (papel: ${role}).`);
} finally {
	await prisma.$disconnect();
}
