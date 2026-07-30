import { Fragment } from "react";
import type { RichTextSegment } from "@/types/content";

type RichTextProps = {
	segments: RichTextSegment[];
	emphasisClassName?: string;
};

/** Renders copy stored as data, keeping emphasis out of raw HTML. */
export function RichText({
	segments,
	emphasisClassName = "text-ink",
}: RichTextProps) {
	return (
		<>
			{segments.map((segment) =>
				typeof segment === "string" ? (
					<Fragment key={segment}>{segment}</Fragment>
				) : (
					<strong className={emphasisClassName} key={segment.text}>
						{segment.text}
					</strong>
				),
			)}
		</>
	);
}
