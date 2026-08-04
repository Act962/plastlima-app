import { Section } from "@/components/ui/section";
import { getAboutContent } from "@/lib/content/about";

export async function WelcomeBanner() {
	const about = await getAboutContent();

	return (
		<Section tone="brand">
			<div className="mx-auto w-full max-w-[1000px] px-5 py-[88px] text-center sm:px-8">
				<p className="font-display font-extrabold text-[clamp(26px,3.6vw,38px)] text-yellow leading-[1.24] tracking-[-0.02em]">
					{about.welcome}
				</p>
			</div>
		</Section>
	);
}
