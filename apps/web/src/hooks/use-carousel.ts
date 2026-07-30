"use client";

import { useCallback, useEffect, useState } from "react";

type CarouselControls = {
	activeIndex: number;
	goTo: (index: number) => void;
	goToPrevious: () => void;
	goToNext: () => void;
};

/** Index state plus auto-advance for any slideshow; knows nothing about slides. */
export function useCarousel(
	length: number,
	autoplayMs = 5000,
): CarouselControls {
	const [activeIndex, setActiveIndex] = useState(0);

	const goTo = useCallback(
		(index: number) => {
			if (length === 0) {
				return;
			}
			setActiveIndex(((index % length) + length) % length);
		},
		[length],
	);

	useEffect(() => {
		if (length < 2 || autoplayMs <= 0) {
			return;
		}

		const timer = setInterval(() => {
			setActiveIndex((current) => (current + 1) % length);
		}, autoplayMs);

		return () => clearInterval(timer);
	}, [length, autoplayMs]);

	return {
		activeIndex,
		goTo,
		goToPrevious: useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]),
		goToNext: useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]),
	};
}
