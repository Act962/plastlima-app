import Link from "next/link";
import { LEGAL_ITEMS, NAV_ITEMS } from "@/data/navigation";
import { getSiteContent } from "@/lib/content/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { FooterColumn, FooterLink } from "./footer-links";
import { SocialIcon } from "./social-icon";

export async function SiteFooter() {
	const site = await getSiteContent();

	return (
		<footer className="bg-brand text-white">
			<div className="mx-auto grid w-full max-w-site grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-[clamp(36px,4vw,64px)] px-5 pt-[clamp(48px,6.5vw,80px)] pb-10 sm:px-8">
				<div className="min-w-0">
					<p className="mb-3.5 font-display font-extrabold text-[30px] text-yellow tracking-[-0.02em]">
						PLASTLIMA
					</p>
					<p className="mb-6 max-w-[340px] text-yellow leading-relaxed">
						{site.tagline}
					</p>
					<ul className="flex flex-wrap gap-2.5">
						{site.social.map((social) => (
							<li key={social.platform}>
								<a
									aria-label={social.label}
									className="inline-flex size-11 items-center justify-center rounded-full border border-yellow/60 text-yellow transition-colors hover:border-yellow hover:bg-yellow hover:text-brand"
									href={social.href}
									rel="noreferrer"
									target="_blank"
									title={social.label}
								>
									<SocialIcon
										className="size-[18px]"
										platform={social.platform}
									/>
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
					<FooterLink external href={site.externalLinks.onlineCatalog}>
						Catálogo
					</FooterLink>
				</FooterColumn>

				<FooterColumn title="Contatos">
					<FooterLink href={`mailto:${site.email}`}>{site.email}</FooterLink>
					<FooterLink external href={whatsappUrl(site.contact.support.phone)}>
						{site.contact.support.display}
					</FooterLink>
					<FooterLink href={`mailto:${site.franchiseEmail}`}>
						{site.franchiseEmail}
					</FooterLink>
				</FooterColumn>
			</div>

			<div className="mx-auto flex w-full max-w-site flex-col gap-4 border-yellow/35 border-t px-5 pt-6 pb-10 text-sm text-yellow sm:flex-row sm:items-center sm:justify-between sm:px-8">
				<span>{site.copyright}</span>
				<nav className="flex flex-wrap gap-x-6 gap-y-2">
					{LEGAL_ITEMS.map((item) => (
						<Link
							className="text-yellow transition-colors hover:text-yellow-soft"
							href={item.href}
							key={item.href}
						>
							{item.label}
						</Link>
					))}
				</nav>
			</div>
		</footer>
	);
}
