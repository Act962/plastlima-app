"use client";

import { Button } from "@plastlima-app/ui/components/button";
import { cn } from "@plastlima-app/ui/lib/utils";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/** Botão de sair — ícone no rodapé da barra lateral. */
export function SignOutButton({ className }: { className?: string }) {
	const router = useRouter();
	const [isPending, setIsPending] = useState(false);

	return (
		<Button
			aria-label="Sair"
			className={cn("text-muted-foreground", className)}
			disabled={isPending}
			onClick={async () => {
				setIsPending(true);
				await authClient.signOut();
				router.push("/login");
				router.refresh();
			}}
			size="icon-sm"
			title="Sair"
			variant="ghost"
		>
			<LogOut />
		</Button>
	);
}
