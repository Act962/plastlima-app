import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/painel/sidebar-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";

export default async function PainelLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (session === null) {
		redirect("/login");
	}

	return (
		<div className="flex min-h-dvh">
			<aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col gap-6 border-border border-r bg-card px-3 py-5">
				<div className="px-3">
					<p className="font-bold text-lg tracking-tight">Plastlima</p>
					<p className="text-muted-foreground text-xs">Painel de conteúdo</p>
				</div>

				<div className="flex-1 overflow-y-auto">
					<SidebarNav />
				</div>

				<div className="flex items-center justify-between gap-2 border-border border-t px-3 pt-4">
					<span
						className="min-w-0 truncate text-muted-foreground text-sm"
						title={session.user.email}
					>
						{session.user.email}
					</span>
					<SignOutButton />
				</div>
			</aside>

			<main className="min-w-0 flex-1">{children}</main>
		</div>
	);
}
