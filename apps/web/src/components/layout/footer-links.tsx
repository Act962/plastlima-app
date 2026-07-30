import type { ReactNode } from "react";

type FooterColumnProps = {
	title: string;
	children: ReactNode;
};

export function FooterColumn({ title, children }: FooterColumnProps) {
	return (
		<div>
			<h2 className="mb-[18px] font-bold text-[13.5px] text-yellow uppercase tracking-[0.08em]">
				{title}
			</h2>
			<div className="flex flex-col gap-[11px]">{children}</div>
		</div>
	);
}

type FooterLinkProps = {
	href: string;
	children: ReactNode;
	external?: boolean;
};

export function FooterLink({ href, children, external }: FooterLinkProps) {
	return (
		<a
			className="w-fit text-[15.5px] text-yellow transition-colors hover:text-yellow-soft"
			href={href}
			rel={external ? "noreferrer" : undefined}
			target={external ? "_blank" : undefined}
		>
			{children}
		</a>
	);
}
