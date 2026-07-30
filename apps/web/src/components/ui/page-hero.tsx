import { Container } from "./container";
import { Eyebrow } from "./eyebrow";
import { Section } from "./section";

type PageHeroProps = {
	eyebrow: string;
	title: string;
	description?: string;
};

/** Shared page opener for the inner routes. */
export function PageHero({ eyebrow, title, description }: PageHeroProps) {
	return (
		<Section border="bottom" tone="surface">
			<Container className="pt-[clamp(48px,6.5vw,80px)] pb-[clamp(44px,6vw,72px)]">
				<Eyebrow className="mb-5">{eyebrow}</Eyebrow>
				<h1 className="type-display max-w-[820px] font-extrabold">{title}</h1>
				{description ? (
					<p className="mt-[18px] max-w-[560px] text-[19px] text-body-muted">
						{description}
					</p>
				) : null}
			</Container>
		</Section>
	);
}
