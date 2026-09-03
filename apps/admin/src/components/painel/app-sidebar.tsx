"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@plastlima-app/ui/components/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { NAV_GROUPS } from "./nav-items";

type Props = {
	email: string;
	role: string;
	/** Leads ainda não atendidos — vira o contador no item "Leads". */
	newLeads: number;
};

export function AppSidebar({ email, role, newLeads }: Props) {
	const pathname = usePathname();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<div className="flex items-center gap-2.5 px-1.5 py-1.5">
					<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand font-bold text-sm text-white">
						P
					</div>
					<div className="grid leading-tight group-data-[collapsible=icon]:hidden">
						<span className="font-semibold tracking-tight">Plastlima</span>
						<span className="text-muted-foreground text-xs">Painel</span>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent>
				{NAV_GROUPS.map((group) => (
					<SidebarGroup key={group.label}>
						<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
						<SidebarMenu>
							{group.items.map((item) => {
								const Icon = item.icon;
								const isActive =
									pathname === item.href ||
									pathname.startsWith(`${item.href}/`);

								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton
											isActive={isActive}
											render={<Link href={item.href} />}
											tooltip={item.label}
										>
											<Icon />
											<span>{item.label}</span>
										</SidebarMenuButton>
										{item.href === "/leads" && newLeads > 0 ? (
											<SidebarMenuBadge>{newLeads}</SidebarMenuBadge>
										) : null}
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroup>
				))}
			</SidebarContent>

			<SidebarFooter>
				<div className="flex items-center gap-2 px-1.5 py-1">
					<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground text-xs">
						{initials(email)}
					</div>
					<div className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
						<span className="truncate font-medium text-sm" title={email}>
							{email}
						</span>
						<span className="text-muted-foreground text-xs">
							{role === "owner" ? "Proprietário" : "Editor"}
						</span>
					</div>
					<SignOutButton className="group-data-[collapsible=icon]:hidden" />
				</div>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}

/** Duas primeiras letras do e-mail, para o avatar de fallback. */
function initials(email: string): string {
	return email.slice(0, 2).toUpperCase();
}
