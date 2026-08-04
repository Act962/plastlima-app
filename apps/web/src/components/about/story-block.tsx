import type { AboutStoryBlock } from "@plastlima-app/core/schemas";
import { cn } from "@plastlima-app/ui/lib/utils";
import { Container } from "@/components/ui/container";
import { ContentImage } from "@/components/ui/content-image";
import { MediaFrame } from "@/components/ui/media-frame";
import { RichText } from "@/components/ui/rich-text";

type StoryBlockProps = {
	block: AboutStoryBlock;
};

/** Renders a single piece of the company story: a paragraph or a full-width photo. */
export function StoryBlock({ block }: StoryBlockProps) {
	if (block.kind === "image") {
		return (
			<Container className="pb-14">
				<MediaFrame>
					<ContentImage
						alt={block.alt}
						sizes="(max-width: 1240px) 100vw, 1240px"
						src={block.src}
					/>
				</MediaFrame>
			</Container>
		);
	}

	return (
		<Container className="pb-7" width="reading">
			<p
				className={cn(
					block.tone === "lead"
						? "type-body-lg text-ink-muted"
						: "type-lead text-body leading-[1.7]",
				)}
			>
				<RichText segments={block.segments} />
			</p>
		</Container>
	);
}
