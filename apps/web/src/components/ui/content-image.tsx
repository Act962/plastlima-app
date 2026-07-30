import { cn } from "@plastlima-app/ui/lib/utils";
import Image from "next/image";

type ContentImageProps = {
	src: string;
	alt: string;
	className?: string;
	sizes?: string;
	priority?: boolean;
};

/**
 * Remote editorial image with a fluid width. The width/height pair is only an
 * aspect hint for the optimizer — `h-auto` keeps the real proportions.
 */
export function ContentImage({
	src,
	alt,
	className,
	sizes = "(max-width: 1024px) 100vw, 600px",
	priority,
}: ContentImageProps) {
	return (
		<Image
			alt={alt}
			className={cn("h-auto w-full", className)}
			height={900}
			priority={priority}
			sizes={sizes}
			src={src}
			width={1200}
		/>
	);
}
