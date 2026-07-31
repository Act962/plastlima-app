"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

const fieldClassName =
	"w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring";

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
			<label className="flex flex-col gap-1.5">
				<span className="font-medium text-sm">E-mail</span>
				<input
					autoComplete="email"
					className={fieldClassName}
					name="email"
					required
					type="email"
				/>
			</label>

			<label className="flex flex-col gap-1.5">
				<span className="font-medium text-sm">Senha</span>
				<input
					autoComplete="current-password"
					className={fieldClassName}
					name="password"
					required
					type="password"
				/>
			</label>

			{error === null ? null : (
				<p className="font-medium text-destructive text-sm" role="alert">
					{error}
				</p>
			)}

			<button
				className="mt-2 w-full cursor-pointer rounded-lg bg-brand px-4 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
				disabled={isSubmitting}
				type="submit"
			>
				{isSubmitting ? "Entrando…" : "Entrar"}
			</button>
		</form>
	);
}
