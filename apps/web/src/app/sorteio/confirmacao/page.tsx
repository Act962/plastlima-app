import { PartyPopper } from "lucide-react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ExternalActionLink } from "@/components/ui/external-action-link";
import { Section } from "@/components/ui/section";
import { RAFFLE_CAMPAIGN } from "@/data/raffle";
import { EXTERNAL_LINKS } from "@/data/site";
import { readParticipationCount } from "@/lib/raffle/participation-cookie";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
	...buildPageMetadata({
		title: "Participação confirmada",
		description: RAFFLE_CAMPAIGN.seo.description,
		path: "/sorteio/confirmacao",
	}),
	// Página de agradecimento não deve aparecer na busca: quem chega nela por fora
	// não participou de nada.
	robots: { index: false, follow: true },
};

export default async function RaffleConfirmationPage() {
	const { confirmation, prize, drawDateLabel } = RAFFLE_CAMPAIGN;

	// Quem já tinha cadastro não vira um segundo registro: o contador sobe. A
	// tela precisa dizer isso, senão parece que o envio não valeu.
	const participationCount = await readParticipationCount();
	const isRepeat = participationCount !== null && participationCount > 1;

	return (
		<Section>
			<Container
				className="py-[clamp(64px,9vw,112px)] text-center"
				width="reading"
			>
				<span
					aria-hidden
					className="mx-auto mb-7 flex size-16 items-center justify-center rounded-full bg-yellow"
				>
					<PartyPopper className="size-8 text-on-yellow" />
				</span>

				<h1 className="type-heading mb-4 font-extrabold">
					{confirmation.title}
				</h1>
				<p className="type-lead mx-auto mb-3 max-w-[540px] text-body">
					{isRepeat
						? confirmation.repeatMessage.replace(
								"{count}",
								String(participationCount),
							)
						: confirmation.message}
				</p>
				{!isRepeat && (
					<p className="mx-auto mb-3 max-w-[540px] text-[15.5px] text-body-muted">
						{confirmation.repeatHint}
					</p>
				)}
				<p className="mx-auto mb-10 max-w-[540px] text-[15.5px] text-body-muted">
					O sorteio do {prize} acontece em {drawDateLabel}. Se você for o
					ganhador, entramos em contato pelo WhatsApp cadastrado.
				</p>

				<div className="mx-auto max-w-[540px] rounded-[20px] border border-line bg-surface p-[clamp(24px,3vw,36px)]">
					<p className="mb-6 text-[16.5px] text-body leading-[1.65]">
						{confirmation.invitation}
					</p>
					<ExternalActionLink href={EXTERNAL_LINKS.onlineCatalog}>
						{confirmation.ctaLabel}
					</ExternalActionLink>
				</div>
			</Container>
		</Section>
	);
}
