import type { Actor } from "@plastlima-app/core";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Resolve a sessão do Better Auth para o `Actor` que os casos de uso conhecem.
 *
 * É a camada anticorrupção da porta `AuthenticatedActor` (spec §2.2): o domínio
 * nunca vê o `User` do Better Auth, só `{ id, email }`. Redireciona para o login
 * quando não há sessão — usar em toda página e action de escrita do painel.
 */
export async function requireActor(): Promise<Actor> {
	const session = await auth.api.getSession({ headers: await headers() });

	if (session === null) {
		redirect("/login");
	}

	return { id: session.user.id, email: session.user.email };
}
