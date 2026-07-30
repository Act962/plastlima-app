import type { OpeningHours } from "@/types/location";

type LocationHoursProps = {
	hours: OpeningHours[];
};

export function LocationHours({ hours }: LocationHoursProps) {
	return (
		<dl className="mb-5 flex flex-col gap-1.5">
			{hours.map((entry) => (
				<div
					className="flex flex-col gap-0.5 border-line-soft border-b border-dashed pb-[7px]"
					key={entry.days}
				>
					<dt className="text-[13px] text-body-muted">{entry.days}</dt>
					<dd className="font-bold text-[15px] text-ink">{entry.time}</dd>
				</div>
			))}
		</dl>
	);
}
