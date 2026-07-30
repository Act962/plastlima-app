"use client";

import { useState } from "react";
import { useLocationFilters } from "@/hooks/use-location-filters";
import type { StoreLocation } from "@/types/location";
import { LocationCard } from "./location-card";
import { LocationFilters } from "./location-filters";

type LocationsExplorerProps = {
	locations: StoreLocation[];
};

export function LocationsExplorer({ locations }: LocationsExplorerProps) {
	const { state, setState, search, setSearch, results } =
		useLocationFilters(locations);
	const [openLocationId, setOpenLocationId] = useState<string | null>(null);

	const closeMapAnd = <T,>(apply: (value: T) => void) => {
		return (value: T) => {
			setOpenLocationId(null);
			apply(value);
		};
	};

	return (
		<div>
			<LocationFilters
				activeState={state}
				onSearchChange={closeMapAnd(setSearch)}
				onStateChange={closeMapAnd(setState)}
				search={search}
			/>

			{results.length > 0 ? (
				<ul className="grid grid-cols-[repeat(auto-fit,minmax(min(304px,100%),1fr))] gap-5">
					{results.map((location) => (
						<LocationCard
							isMapOpen={openLocationId === location.id}
							key={location.id}
							location={location}
							onToggleMap={() =>
								setOpenLocationId((current) =>
									current === location.id ? null : location.id,
								)
							}
						/>
					))}
				</ul>
			) : (
				<p className="py-[72px] text-center text-base text-label">
					Nenhuma unidade encontrada. Tente outra cidade.
				</p>
			)}
		</div>
	);
}
