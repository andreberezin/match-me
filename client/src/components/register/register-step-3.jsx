// step 3 of registration
import Select from 'react-select';
import {customStyles} from '../reusables/customInputStyles.jsx';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {stepThreeSchema} from './validationSchema.jsx';
import {ErrorElement} from '../reusables/errorElement.jsx';
import {PreviousNextButtons} from '../reusables/previousNextButtons.jsx';
import {IncrementDecrementButtons} from '../reusables/incrementDecrementButtons.jsx';
import {useGooglePlacesApi} from '../reusables/useGooglePlacesApi.jsx';
import {useGeolocation} from '../reusables/useGeolocation.jsx';

const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;

function Step3({formThreeData, setFormThreeData, stepFunctions, formOneData, onSubmit}) {
	const [useCurrentLocation, setUseCurrentLocation] = useState(false);
	const [dots, setDots] = useState('.');

	const {fetchPlaces, options} = useGooglePlacesApi();

	// Use our geolocation hook
	const {location: geolocation, requestLocation} = useGeolocation({
		enableHighAccuracy: true,
		maximumAge: 30000, // 30 seconds
		timeout: 27000 // 27 seconds
	});

	// Initialize react-hook-form with Yup schema
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		trigger,
		setError,
		formState: {errors, isValid}
	} = useForm({
		defaultValues: formThreeData,
		resolver: yupResolver(stepThreeSchema(formOneData)),
		mode: 'onChange'
	});

	// Update form data when geolocation is available
	useEffect(() => {
		if (useCurrentLocation && geolocation.loaded && geolocation.coordinates.lat) {
			setValue('latitude', geolocation.coordinates.lat, {shouldValidate: true});
			setValue('longitude', geolocation.coordinates.lng, {shouldValidate: true});

			setFormThreeData((prev) => ({
				...prev,
				latitude: geolocation.coordinates.lat,
				longitude: geolocation.coordinates.lng
			}));

			// Get location name using reverse geocoding
			if (geolocation.coordinates.lat && geolocation.coordinates.lng) {
				fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${geolocation.coordinates.lat},${geolocation.coordinates.lng}&key=${googleApiKey}`)
					.then(response => response.json())
					.then(data => {
						if (data.status === 'OK' && data.results.length > 0) {
							const addressComponents = data.results[0].address_components;

							let region = '';
							let country = '';

							// Extract city and country from address components
							addressComponents.forEach(component => {
								if (component.types.includes('administrative_area_level_1')) {
									region = component.long_name;
								}
								if (component.types.includes('country')) {
									country = component.long_name;
								}
							});

							const formattedLocation = `${region}${country ? `, ${country}` : ''}`;

							// Create an object similar to what Select would produce
							const locationObj = {
								value: 'geo_' + geolocation.coordinates.lat + '_' + geolocation.coordinates.lng,
								label: formattedLocation
							};

							setValue('location', locationObj, {shouldValidate: true});
							setFormThreeData((prev) => ({...prev, location: locationObj}));
						}
					})
					.catch(error => {
						console.error('Geocoding error:', error);
						setError('location', {type: 'manual', message: geolocation.error.message});
					});
			}
		}
	}, [geolocation, useCurrentLocation, setValue, setFormThreeData, setError]);

	// Handle max distance change
	const handleMaxDistanceChange = (e) => {
		const value = parseInt(e.target.value, 10);
		setValue('maxMatchRadius', value, {shouldValidate: true});
		setFormThreeData((prev) => ({
			...prev,
			maxMatchRadius: value
		}));
	};


	useEffect(() => {
		let interval;

		if (!geolocation?.loaded) {
			interval = setInterval(() => {
				setDots(prev => (prev.length < 3 ? prev + '.' : '.'));
			}, 200);
			return () => clearInterval(interval);
		}

		if (geolocation?.loaded && geolocation.error) {
			setError('location', {type: 'manual', message: geolocation.error.message});
		}

		return () => {
			if (interval) clearInterval(interval);
		}

	}, [geolocation?.loaded, geolocation.error, setError]);

	return (
		<form className='step-three'
			  onSubmit={handleSubmit((data) => onSubmit(data, formThreeData, setFormThreeData))}
			  autoComplete={'off'}
			  noValidate>

			<div className='form-title'>
				<h1>A little bit more...</h1>
			</div>

			<div className={'line'}>
				<label id='experience' className={'short'}>
					Experience*
					<br/>
					<div className={'with-button'}>
						<input
							type='number'
							id='experience'
							name={'experience'}
							className={`not-react-select focus-highlight short 
						${errors.experience ? 'error' : ''}
						${!errors.experience && watch('experience') ? 'valid' : ''}`}
							placeholder='in years'
							// autoFocus={true}
							{...register('experience')}
							autoComplete={'off'}
							min={0}
							max={formOneData.age}
							value={watch('experience')}
							onChange={(e) => {
								const value = e.target.value ? parseInt(e.target.value, 10) : 0;
								setValue('experience', value, {shouldValidate: true});
								setFormThreeData((prev) => ({...prev, experience: value}));
							}}
							onBlur={() => trigger('experience')} // Trigger validation when user leaves the field
						/>
						<IncrementDecrementButtons id={'experience'} watch={watch} setValue={setValue} trigger={trigger}
												   setFormData={setFormThreeData}/>
					</div>

					<ErrorElement errors={errors} id={'experience'}/>
				</label>
				<label id='music' className={'short'}>
					Link to your music
					<br/>
					<input
						type='url'
						id='music'
						name={'musicLink'}
						className={`not-react-select focus-highlight short
						${errors.musicLink ? 'error' : ''}
						${!errors.musicLink && watch('musicLink') ? 'valid' : ''}`}
						placeholder='Spotify link etc'
						value={watch('musicLink') || ''}
						{...register('musicLink')}
						autoComplete={'off'}
						onChange={(e) => {
							const selectedValue = e.target.value;
							setValue('musicLink', selectedValue, {shouldValidate: true});
							setFormThreeData((prev) => ({...prev, musicLink: selectedValue}));
						}}
						onBlur={() => trigger('musicLink')} // Trigger validation when user leaves the field
					/>
					<ErrorElement errors={errors} id={'musicLink'}/>
				</label>
			</div>

			<div className={'line large'}>
				<label id='location' className={'long'}>
					Location*
					<br/>
					<div className='location-toggle'>
						<div className={`location-option ${!useCurrentLocation ? 'active' : ''}`} onClick={() => {
							setUseCurrentLocation(false);
						}}>
							Search location
						</div>
						<div className={`location-option ${useCurrentLocation ? 'active' : ''}`} onClick={() => {
							requestLocation();
							setUseCurrentLocation(true);
						}}>
							Current location
						</div>
					</div>

					{!useCurrentLocation ? (
						<Select
							options={options}
							onInputChange={(val) => {
								fetchPlaces(val);
							}}
							placeholder='Search for your county'
							isClearable={true}
							styles={customStyles}
							wideMenu={true}
							closeMenuOnSelect={true}
							value={watch('location') || ''}
							autoComplete={'off'}
							isValid={
								!errors.location &&
								watch('location') &&
								watch('location').label &&
								watch('location').value
							}
							isError={!!errors.location} // Check if error exists
							onChange={(selectedOption) => {
								if (!selectedOption) {
									setValue('location', null, {shouldValidate: true});
									setFormThreeData((prev) => ({...prev, location: null}));
									return;
								}

								fetch(`https://maps.googleapis.com/maps/api/geocode/json?place_id=${selectedOption.value}&key=${googleApiKey}&language=en`)
									.then(response => response.json())
									.then(data => {
										if (data.status === 'OK' && data.results.length > 0) {
											const addressComponents = data.results[0].address_components;
											const geometry = data.results[0].geometry;

											let region = '';
											let country = '';

											// Extract administrative area and country explicitly
											addressComponents.forEach(component => {
												if (component.types.includes('administrative_area_level_1')) {
													region = component.long_name;
												}
												if (component.types.includes('country')) {
													country = component.long_name;
												}
											});

											const properName = `${region}${country ? `, ${country}` : ''}`; // Ensure "Tartu County, Estonia"

											// Store the location object with the proper name
											const locationObj = {
												value: selectedOption.value,
												label: properName
											};

											setValue('location', locationObj, {shouldValidate: true});

											// Also store latitude and longitude if available
											if (geometry && geometry.location) {
												setValue('latitude', geometry.location.lat, {shouldValidate: true});
												setValue('longitude', geometry.location.lng, {shouldValidate: true});

												setFormThreeData((prev) => ({
													...prev,
													location: locationObj,
													latitude: geometry.location.lat,
													longitude: geometry.location.lng
												}));
											} else {
												setFormThreeData((prev) => ({...prev, location: locationObj}));
											}
										}
									})
									.catch(error => {
										console.error('Geocoding error:', error);
										setError('location', {type: 'manual', message: geolocation.error.message});
									});
							}}
							onBlur={() => trigger('location')} // Trigger validation when user leaves the field
						/>
					) : (
						<div className='current-location-display' style={{
							backgroundColor: geolocation?.error
								? '#F5D9D9' // Red background if there's an error
								: geolocation?.loaded
									? '#D4F5D9' // Green background if location is loaded
									: 'white' // Default background
						}}>
							{geolocation?.loaded ? (
								geolocation.error ? (
									<div className='location-error'>
										Please allow location access
										{/*<div className='error-details'>{geolocation.error.message}</div>*/}
									</div>
								) : (
									geolocation.coordinates.lat ? (
										<div className='location-info'>
											<div className='location-name'>
												{watch('location')?.label || 'Detecting your location...'}
											</div>
											<div className='coordinates'>
												Lat: {geolocation.coordinates.lat.toFixed(4)},
												Lng: {geolocation.coordinates.lng.toFixed(4)}
											</div>
										</div>
									) : (
										<div className='loading-location'>Waiting for your coordinates{dots}</div>
									)
								)
							) : (
								<div className='loading-location'>Requesting location access{dots}</div>
							)}
						</div>
					)}
					<ErrorElement errors={errors} id={'location'}/>
				</label>
			</div>

			{/* Max match radius slider */}
			<div className={'line large'}>
				<label id='maxMatchRadius' className={'long'}>
					Maximum matching distance
					<br/>
					<div className='distance-slider-container'>
						<input
							type='range'
							min='5'
							max='500'
							step='5'
							value={watch('maxMatchRadius')}
							className='distance-slider'
							onChange={handleMaxDistanceChange}
							{...register('maxMatchRadius')}
						/>

					</div>
					<div className='distance-labels'>
						<span>5 km</span>
						<div className='distance-value'>{watch('maxMatchRadius')} km</div>
						<span>500 km</span>
					</div>
					<ErrorElement errors={errors} id={'maxMatchRadius'}/>
				</label>
			</div>

			{/* Hidden inputs for latitude and longitude */}
			<input
				type='hidden'
				{...register('latitude')}
			/>
			<input
				type='hidden'
				{...register('longitude')}
			/>

			<div className={'line large'}>
				<label id='description'>
					Description
					<br/>
					<textarea
						maxLength={300}
						id='description'
						name={'description'}
						className={`description-container focus-highlight
						${errors.description ? 'error' : ''}
						${!errors.description && watch('description') ? 'valid' : ''}`}
						placeholder='Say a few words about yourself...'
						{...register('description')}
						autoComplete={'off'}
						value={formThreeData.description || ''}
						onChange={(e) => {
							const value = e.target.value;
							setValue('description', value, {shouldValidate: true});
							setFormThreeData((prev) => ({...prev, description: value}));
						}}
					/>
					<ErrorElement errors={errors} id={'description'}/>
				</label>
			</div>
			<PreviousNextButtons
				DeductStep={stepFunctions.DeductStep}
				errors={errors}
				isValid={isValid}
			/>
		</form>
	);
}

export default Step3;
