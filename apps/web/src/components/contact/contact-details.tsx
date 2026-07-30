import type { ReactNode } from "react";
import { CONTACT, SITE } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";

type DetailProps = {
	title: string;
	children: ReactNode;
	withDivider?: boolean;
};

function Detail({ title, children, withDivider }: DetailProps) {
	return (
		<div
			className={
				withDivider ? "border-line-soft border-t pt-[22px]" : undefined
			}
		>
			<p className="mb-1.5 font-bold text-[12px] text-label uppercase tracking-[0.06em]">
				{title}
			</p>
			{children}
		</div>
	);
}

export function ContactDetails() {
	return (
		<div className="flex flex-col gap-[22px] rounded-[20px] border border-line bg-surface p-8">
			<Detail title="Endereço">
				<p className="text-[16.5px] text-ink leading-normal">{SITE.address}</p>
			</Detail>

			<Detail title="Whatsapp" withDivider>
				<a
					className="font-display font-extrabold text-[24px] text-ink tracking-[-0.02em] transition-colors hover:text-brand"
					href={whatsappUrl(CONTACT.support.phone)}
					rel="noreferrer"
					target="_blank"
				>
					{CONTACT.support.display}
				</a>
			</Detail>

			<Detail title="Email" withDivider>
				<a
					className="text-[16.5px] text-brand transition-colors hover:text-brand-dark"
					href={`mailto:${SITE.email}`}
				>
					{SITE.email}
				</a>
			</Detail>
		</div>
	);
}
