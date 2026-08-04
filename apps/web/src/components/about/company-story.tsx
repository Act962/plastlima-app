import { Section } from "@/components/ui/section";
import { getAboutContent } from "@/lib/content/about";
import { StoryBlock } from "./story-block";

export async function CompanyStory() {
	const about = await getAboutContent();

	return (
		<Section className="pt-[clamp(48px,6.5vw,80px)] pb-[clamp(40px,6vw,60px)]">
			{about.story.map((block) => (
				<StoryBlock block={block} key={block.id} />
			))}
		</Section>
	);
}
