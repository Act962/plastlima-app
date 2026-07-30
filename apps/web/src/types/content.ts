/** A run of text that may be emphasised, so copy stays data instead of markup. */
export type RichTextSegment = string | { text: string; emphasis: true };

export type Stat = {
	value: string;
	label: string;
};

export type TimelineEntry = {
	year: string;
	description: string;
};

export type MediaItem = {
	src: string;
	alt: string;
};
