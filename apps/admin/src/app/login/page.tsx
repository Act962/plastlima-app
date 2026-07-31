import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (session !== null) {
		redirect("/participantes");
	}

	return (
		<main className="flex min-h-svh items-center justify-center bg-muted/40 px-4">
			<div className="w-full max-w-sm rounded-xl border border-border bg-background p-8 shadow-sm">
				<h1 className="font-bold text-xl tracking-tight">Painel Plastlima</h1>
				<p className="mt-1.5 mb-7 text-muted-foreground text-sm">
					Acesso restrito à equipe.
				</p>
				<LoginForm />
			</div>
		</main>
	);
}
