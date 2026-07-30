import Link from "next/link";
import { NAV_ITEMS } from "@/data/navigation";
import { CONTACT, EXTERNAL_LINKS, SITE, SOCIAL_LINKS } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { FooterColumn, FooterLink } from "./footer-links";

export function SiteFooter() {
	return (
		<footer className="bg-brand text-white">
			<div className="mx-auto grid w-full max-w-site grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-[clamp(36px,4vw,64px)] px-5 pt-[clamp(48px,6.5vw,80px)] pb-10 sm:px-8">
				<div className="min-w-0">
					<p className="mb-3.5 font-display font-extrabold text-[30px] text-yellow tracking-[-0.02em]">
						PLASTLIMA
					</p>
					<p className="mb-6 max-w-[340px] text-yellow leading-relaxed">
						{SITE.tagline}
					</p>
					<ul className="flex flex-wrap gap-2.5">
						{SOCIAL_LINKS.map((social) => (
							<li key={social.label}>
								<a
									className="inline-flex rounded-full border border-yellow/60 px-4 py-2.5 font-semibold text-sm text-yellow transition-colors hover:border-yellow hover:text-yellow-soft"
									href={social.href}
									rel="noreferrer"
									target="_blank"
								>
									{social.label}
								</a>
							</li>
						))}
					</ul>
				</div>

				<FooterColumn title="Links Rápidos">
					{NAV_ITEMS.map((item) => (
						<Link
							className="w-fit text-[15.5px] text-yellow transition-colors hover:text-yellow-soft"
							href={item.href}
							key={item.href}
						>
							{item.label}
						</Link>
					))}
					<FooterLink external href={EXTERNAL_LINKS.onlineCatalog}>
						Catálogo
					</FooterLink>
				</FooterColumn>

				<FooterColumn title="Contatos">
					<FooterLink href={`mailto:${SITE.email}`}>{SITE.email}</FooterLink>
					<FooterLink external href={whatsappUrl(CONTACT.support.phone)}>
						{CONTACT.support.display}
					</FooterLink>
					<FooterLink href={`mailto:${SITE.franchiseEmail}`}>
						{SITE.franchiseEmail}
					</FooterLink>
				</FooterColumn>
			</div>

			<div className="mx-auto w-full max-w-site border-yellow/35 border-t px-5 pt-6 pb-10 text-sm text-yellow sm:px-8">
				{SITE.copyright}
			</div>
		</footer>
	);
}
