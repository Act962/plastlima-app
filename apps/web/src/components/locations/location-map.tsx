type LocationMapProps = {
	src: string;
	title: string;
};

export function LocationMap({ src, title }: LocationMapProps) {
	return (
		<div className="border-line border-t">
			<iframe
				className="block h-[240px] w-full border-0"
				loading="lazy"
				src={src}
				title={title}
			/>
		</div>
	);
}
