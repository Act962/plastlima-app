import { actionClassName } from "@/components/ui/action-styles";
import { ExternalActionLink } from "@/components/ui/external-action-link";
import type { StoreLocation } from "@/types/location";
import { LocationHours } from "./location-hours";
import { LocationMap } from "./location-map";

type LocationCardProps = {
	location: StoreLocation;
	isMapOpen: boolean;
	onToggleMap: () => void;
};

export function LocationCard({
	location,
	isMapOpen,
	onToggleMap,
}: LocationCardProps) {
	return (
		<li className="flex flex-col overflow-hidden rounded-[18px] border border-line bg-surface">
			<div className="px-[22px] pt-6 pb-5">
				<p className="mb-2.5 font-mono text-[12px] text-label uppercase tracking-[0.1em]">
					{location.state} — {location.city}
				</p>
				<h2 className="mb-[18px] font-bold text-[22px]">{location.name}</h2>

				<p className="mb-2 font-bold text-[12px] text-label uppercase tracking-[0.04em]">
					Horário de funcionamento
				</p>
				<LocationHours hours={location.hours} />

				<p className="mb-1.5 font-bold text-[12px] text-label uppercase tracking-[0.04em]">
					Contato
				</p>
				<p className="font-bold font-display text-[19px] tracking-[-0.01em]">
					{location.phone}
				</p>
			</div>

			<div className="mt-auto flex flex-wrap gap-2 px-[22px] pb-[22px]">
				<ExternalActionLink href={location.whatsappUrl} size="sm">
					Atendimento
				</ExternalActionLink>
				<button
					aria-expanded={isMapOpen}
					className={actionClassName({ variant: "outline", size: "sm" })}
					onClick={onToggleMap}
					type="button"
				>
					{isMapOpen ? "Ocultar mapa" : "Ver no mapa"}
				</button>
				{location.instagramUrl ? (
					<ExternalActionLink
						href={location.instagramUrl}
						size="sm"
						variant="outline"
					>
						Instagram
					</ExternalActionLink>
				) : null}
			</div>

			{isMapOpen ? (
				<LocationMap
					src={location.mapEmbedUrl}
					title={`Mapa — ${location.name}`}
				/>
			) : null}
		</li>
	);
}
