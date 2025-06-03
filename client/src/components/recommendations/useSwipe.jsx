import {useRef, useState} from 'react';

// custom hook to handle swiping function on mobile
export function useSwipe() {
	const touchStartX = useRef(null);
	const touchEndX = useRef(null);
	const [swipeProgress, setSwipeProgress] = useState(0);

	function handleTouchStart(event) {
		touchStartX.current = event.touches[0].clientX;
		touchEndX.current = null; // Reset
		setSwipeProgress(0);
	}

	function handleTouchMove(event) {
		touchEndX.current = event.touches[0].clientX;

		const swipeDistance = Math.abs(touchStartX.current - touchEndX.current);
		const minSwipeDistance = 200;
		const progress = Math.min(swipeDistance * 2 / minSwipeDistance, 3);
		setSwipeProgress(progress);
	}

	function handleTouchEnd(swipeFunction) {
		if (touchStartX.current === null || touchEndX.current === null) return;

		const swipeDistance = touchStartX.current - touchEndX.current;
		const minSwipeDistance = 220; // Minimum distance to be considered a swipe

		if (swipeDistance > minSwipeDistance) {
			// right to left swipe
			swipeFunction('like');
		} else if (swipeDistance < -minSwipeDistance) {
			// left to right swipe
			swipeFunction('dislike');
		}

		touchStartX.current = null;
		touchEndX.current = null;
		setSwipeProgress(0);

	}

	return {
		handleTouchStart,
		handleTouchEnd,
		handleTouchMove,
		swipeProgress
	};
}

