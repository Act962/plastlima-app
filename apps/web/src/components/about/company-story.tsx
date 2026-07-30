import { Section } from "@/components/ui/section";
import { ABOUT_STORY } from "@/data/about";
import { StoryBlock } from "./story-block";

export function CompanyStory() {
	return (
		<Section className="pt-[clamp(48px,6.5vw,80px)] pb-[clamp(40px,6vw,60px)]">
			{ABOUT_STORY.map((block) => (
				<StoryBlock block={block} key={block.id} />
			))}
		</Section>
	);
}
