import { LOCATION_STATES, type StoreLocation } from "@/types/location";

export const ALL_STATES_FILTER = "Todas";

export type StateFilter =
	| typeof ALL_STATES_FILTER
	| (typeof LOCATION_STATES)[number];

export const STATE_FILTERS: StateFilter[] = [
	ALL_STATES_FILTER,
	...LOCATION_STATES,
];

export type LocationQuery = {
	state: StateFilter;
	search: string;
};

/** Pure filtering rule, kept out of the components so it can be reused and tested. */
export function filterLocations(
	locations: StoreLocation[],
	{ state, search }: LocationQuery,
): StoreLocation[] {
	const term = search.trim().toLowerCase();

	return locations.filter((location) => {
		const matchesState =
			state === ALL_STATES_FILTER || location.state === state;
		const matchesSearch =
			!term ||
			`${location.name} ${location.city} ${location.state}`
				.toLowerCase()
				.includes(term);

		return matchesState && matchesSearch;
	});
}
