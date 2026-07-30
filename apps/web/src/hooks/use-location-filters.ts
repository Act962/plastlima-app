"use client";

import { useMemo, useState } from "react";
import {
	ALL_STATES_FILTER,
	filterLocations,
	type StateFilter,
} from "@/lib/locations";
import type { StoreLocation } from "@/types/location";

/** Owns the filter state; the matching rule itself lives in `lib/locations`. */
export function useLocationFilters(locations: StoreLocation[]) {
	const [state, setState] = useState<StateFilter>(ALL_STATES_FILTER);
	const [search, setSearch] = useState("");

	const results = useMemo(
		() => filterLocations(locations, { state, search }),
		[locations, state, search],
	);

	return { state, setState, search, setSearch, results };
}
