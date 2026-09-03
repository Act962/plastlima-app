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
			<div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
				<div className="flex items-center gap-3">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand font-bold text-lg text-white">
						P
					</div>
					<div className="leading-tight">
						<h1 className="font-semibold tracking-tight">Painel Plastlima</h1>
						<p className="text-muted-foreground text-sm">
							Acesso restrito à equipe.
						</p>
					</div>
				</div>
				<LoginForm />
			</div>
		</main>
	);
}
