"use client";

import { Button } from "@plastlima-app/ui/components/button";
import { Input } from "@plastlima-app/ui/components/input";
import { Label } from "@plastlima-app/ui/components/label";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSubmitting(true);
		setError(null);

		const form = new FormData(event.currentTarget);

		const { error: signInError } = await authClient.signIn.email({
			email: String(form.get("email") ?? ""),
			password: String(form.get("password") ?? ""),
		});

		if (signInError) {
			// Falha de credencial e falha de servidor precisam de mensagens
			// diferentes: tratar as duas como "senha errada" faz o usuário tentar de
			// novo indefinidamente quando o problema é o banco estar fora.
			const isCredentialFailure =
				signInError.status === 401 || signInError.status === 403;

			setError(
				isCredentialFailure
					? // Genérica de propósito: dizer "este e-mail não existe" revela
						// quais contas são válidas para quem tenta invadir.
						"E-mail ou senha inválidos."
					: "Não foi possível entrar agora. Tente novamente em instantes.",
			);
			setIsSubmitting(false);
			return;
		}

		router.push("/participantes");
		router.refresh();
	}

	return (
		<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
			<div className="flex flex-col gap-2">
				<Label htmlFor="email">E-mail</Label>
				<Input
					autoComplete="email"
					id="email"
					name="email"
					required
					type="email"
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="password">Senha</Label>
				<Input
					autoComplete="current-password"
					id="password"
					name="password"
					required
					type="password"
				/>
			</div>

			{error === null ? null : (
				<p className="font-medium text-destructive text-sm" role="alert">
					{error}
				</p>
			)}

			<Button className="mt-2 w-full" disabled={isSubmitting} type="submit">
				{isSubmitting ? "Entrando…" : "Entrar"}
			</Button>
		</form>
	);
}
