import { Container } from "@/components/ui/container";
import { ExternalActionLink } from "@/components/ui/external-action-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { CONTACT } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { FRANCHISE_FORM_ID } from "./constants";

export function FranchiseHero() {
	return (
		<Section tone="brand">
			<Container className="grid grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] items-center gap-[clamp(40px,5vw,64px)] pt-[clamp(56px,7.5vw,96px)] pb-[100px]">
				<div>
					<Eyebrow className="mb-[22px] text-yellow">
						Seja um franqueado
					</Eyebrow>
					<h1 className="type-display mb-[22px] font-extrabold text-white">
						Um sucesso que só cresce
					</h1>
					<p className="mb-9 max-w-[520px] text-[18.5px] text-white leading-[1.6]">
						A primeira franquia no varejo de produtos descartáveis do Brasil.
						Vinte anos de fórmula testada, agora aberta para novos parceiros.
					</p>
					<div className="flex flex-wrap gap-3">
						<a
							className="inline-flex cursor-pointer items-center justify-center rounded-full bg-yellow px-[30px] py-4 font-bold text-[15px] text-ink transition-colors hover:bg-yellow-bright"
							href={`#${FRANCHISE_FORM_ID}`}
						>
							Cadastre-se aqui
						</a>
						<ExternalActionLink
							href={whatsappUrl(CONTACT.franchise.phone)}
							variant="outlineLight"
						>
							Falar com um consultor
						</ExternalActionLink>
					</div>
				</div>

				<div className="flex aspect-[4/3.2] items-center justify-center rounded-[20px] border border-white/15 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.05)_0_11px,rgba(255,255,255,.02)_11px_22px)] px-6 text-center">
					<span className="font-mono text-[12px] text-yellow-pale tracking-[0.06em]">
						[ foto da loja franqueada
						<br />
						layout padronizado ]
					</span>
				</div>
			</Container>
		</Section>
	);
}
