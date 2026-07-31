"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
	const router = useRouter();
	const [isPending, setIsPending] = useState(false);

	return (
		<button
			className="cursor-pointer rounded-lg border border-border px-3 py-1.5 font-medium text-sm transition-colors hover:bg-muted disabled:opacity-60"
			disabled={isPending}
			onClick={async () => {
				setIsPending(true);
				await authClient.signOut();
				router.push("/login");
				router.refresh();
			}}
			type="button"
		>
			{isPending ? "Saindo…" : "Sair"}
		</button>
	);
}
