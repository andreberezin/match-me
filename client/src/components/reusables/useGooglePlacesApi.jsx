import {useCallback, useEffect, useRef, useState} from 'react';

// custom hook for googles places api
export const useGooglePlacesApi = () => {
	const autocompleteServiceRef = useRef(null);
	const [apiLoaded, setApiLoaded] = useState(false);
	const [options, setOptions] = useState([]);

	useEffect(() => {
		const checkGoogleApi = setInterval(() => {
			if (window.google?.maps?.places) {
				autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
				setApiLoaded(true);
				console.log('Google API is loaded');
				clearInterval(checkGoogleApi);
			}
		}, 100);

		return () => clearInterval(checkGoogleApi); // Cleanup interval when unmounting
	}, []);

	const fetchPlaces = useCallback((input) => {
		if (!input || !apiLoaded || !autocompleteServiceRef.current) return;

		autocompleteServiceRef.current.getPlacePredictions(
			{
				input,
				types: ['administrative_area_level_1'],
				componentRestrictions: {country: 'est'},
				language: 'en'
			},
			(predictions, status) => {
				if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
					setOptions(
						predictions.map((place) => ({
							value: place.place_id,
							label: place.description
						}))
					);
				} else {
					setOptions([]);
				}
			}
		).catch(error => console.error('Unhandled error at getPlacePredictions: ', error));
	}, [apiLoaded]);

	return {apiLoaded, autocompleteServiceRef, fetchPlaces, options};
};