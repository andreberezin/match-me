import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import Select from 'react-select';
import {customStyles} from '../../reusables/customInputStyles.jsx';
import {
	genreOptions,
	goalsOptions,
	interestsOptions,
	methodsOptions,
	personalityTraitsOptions
} from '../../reusables/inputOptions.jsx';
import {IncrementDecrementButtons} from '../../reusables/incrementDecrementButtons.jsx';
import './forms.scss';
import '../../reusables/incrementDecrementButtons.scss';
import '../../reusables/errorElement.scss';
import {ErrorElement} from '../../reusables/errorElement.jsx';
import {useEffect, useState} from 'react';
import {dashboardFormValidationSchema} from './dashboardFormValidationSchema.jsx';
import {CustomSelect} from '../../register/register-step-2.jsx';
import {useGooglePlacesApi} from '../../reusables/useGooglePlacesApi.jsx';
import {closeSettings} from '../../reusables/profile-card-functions.jsx';
import axios from 'axios';
import {useAuth} from '../../utils/AuthContext.jsx';
import {IoClose} from 'react-icons/io5';
import useGeolocation from '../../reusables/useGeolocation.jsx';

// bio form page of /dashboard settings
export function DashboardForm({myData, setMyData, setMyDataFormatted, formatDataForView}) {
	const {fetchPlaces, options} = useGooglePlacesApi();
	const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
	const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
	const {tokenValue} = useAuth();

	const [useCurrentLocation, setUseCurrentLocation] = useState(false);
	// const [maxMatchRadius, setMaxMatchRadius] = useState(myData.maxMatchRadius || 50);
	const [dots, setDots] = useState('.');
	// const [inputValue, setInputValue] = useState('');
	const [geoLoading, setGeoLoading] = useState(false);

	// console.log('myData changed');

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
		clearErrors,
		setError,
		trigger,
		reset,
		formState: {errors, isValid}
	} = useForm({
		defaultValues: myData,
		resolver: yupResolver(dashboardFormValidationSchema),
		mode: 'onChange'
	});

	// Update form data when geolocation is available
	useEffect(() => {
		if (useCurrentLocation && geolocation.loaded && geolocation.coordinates.lat) {
			setValue('latitude', geolocation.coordinates.lat, {shouldValidate: true});
			setValue('longitude', geolocation.coordinates.lng, {shouldValidate: true});

			// setMyData((prev) => ({
			// 	...prev,
			// 	latitude: geolocation.coordinates.lat,
			// 	longitude: geolocation.coordinates.lng
			// }));

			// Get location name using reverse geocoding
			if (geolocation.coordinates.lat && geolocation.coordinates.lng) {
				fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${geolocation.coordinates.lat},${geolocation.coordinates.lng}&key=${GOOGLE_API_KEY}`)
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
							// setMyData((prev) => ({...prev, location: locationObj}));
						}
					})
					.catch(error => console.error('Geocoding error:', error));
			}
		}
	}, [geolocation, useCurrentLocation, setValue, setMyData, GOOGLE_API_KEY]);


	useEffect(() => {
		let interval;

		if (!geolocation?.loaded && geoLoading) {
			interval = setInterval(() => {
				setDots(prev => (prev.length < 3 ? prev + '.' : '.'));
			}, 200);
		}

		if (geolocation.loaded && geoLoading) {
			setGeoLoading(false);
		}

		return () => {
			if (interval) clearInterval(interval);
		}

	}, [geoLoading, geolocation]);

	// on submit send data to backend
	const Submit = async (formattedData) => {
		try {
			await
				axios.patch(`${VITE_BACKEND_URL}/api/me/profile`, formattedData, {
					headers: {
						Authorization: `Bearer ${tokenValue}`,
						'Content-Type': 'application/json'
					}

				});
		} catch (error) {
			if (error.response) {
				console.error('Backend error:', error.response.data); // Server responded with an error
			} else {
				console.error('Request failed:', error.message); // Network error or request issue
			}
		}
	};

	// on submit send location data to backend
	const SubmitLocation = async (locationData) => {
		console.log('Sending:', JSON.stringify(locationData, null, 2));
		try {
			const response = await
				axios.post(`${VITE_BACKEND_URL}/api/me/location`, locationData, {
					headers: {
						Authorization: `Bearer ${tokenValue}`,
						'Content-Type': 'application/json'
					}

				});
			console.log('Location data edited successfully');
			console.log('Data: ', response.data);
		} catch (error) {
			if (error.response) {
				console.error('Backend error:', error.response.data); // Server responded with an error
			} else {
				console.error('Request failed:', error.message); // Network error or request issue
			}
		}
	};

	return (
		<>
			<button className='close-settings' type={'button'} onClick={() => {
				reset();
				closeSettings();
				setGeoLoading(false);
			}}><IoClose/></button>

			{/* todo add animation to show users data change was successful (like an animated checkmark)*/}
			<form className='dashboard-form'
				  onSubmit={handleSubmit((data) => {
					  setMyData(data);

					  console.log('Data at submit: ', data);

					  const formattedData = {
						  // age: data.age,
						  // gender: data.gender.value,
						  location: data.location.label,
						  description: data.description,
						  yearsOfMusicExperience: data.yearsOfMusicExperience,
						  linkToMusic: data.linkToMusic,
						  additionalInterests: data.additionalInterests.map(item => item.value),
						  preferredMethod: data.preferredMethod.map(item => item.value),
						  preferredMusicGenres: data.preferredMusicGenres.map(item => item.value),
						  goalsWithMusic: data.goalsWithMusic.map(item => item.value),
						  personalityTraits: data.personalityTraits.map(item => item.value),
					  };

					  const locationData = {
						  latitude: data.latitude,
						  longitude: data.longitude,
					  }

					  SubmitLocation(locationData).catch(error => console.error('Unhandled error at SubmitLocation: ', error));

					  Submit(formattedData).catch(error => console.error('Unhandled error at Submit: ', error));

					  setMyDataFormatted((prev) => ({
						  ...prev,
						  ...formatDataForView(formattedData)
					  }));
					  console.log('Errors on submit: ', errors);
				  })}
				  autoComplete={'off'}
				  noValidate
				  id={'dashboard-form'}>

				{/* step 1 */}
				{/*<div className='form-title'>*/}
				{/*	<h1>Basic info</h1>*/}
				{/*</div>*/}

				<div className='form-title'>
					<h1>About you</h1>
				</div>

				{/*/!* First Name *!/*/}
				{/*<div className="line">*/}
				{/*	<label className="long">*/}
				{/*		First name**/}
				{/*		<input*/}
				{/*			type="text"*/}
				{/*			placeholder="Enter your first name"*/}
				{/*			className={`not-react-select long focus-highlight */}
				{/*				${errors.firstName ? "error" : ""}*/}
				{/*				${!errors.firstName && watch('firstName') ? "valid" : ""}`}*/}
				{/*			{...register("firstName")}*/}
				{/*			autoComplete={"off"}*/}
				{/*			// value={myData.firstName}*/}
				{/*			value={watch('firstName') || myData.firstName}*/}
				{/*			// autoFocus={'on'}*/}
				{/*			onBlur={() => trigger('firstName')} // Trigger validation when user leaves the field*/}
				{/*			// onChange={(value) => {*/}
				{/*			// 	setMyData((prev) => ({ ...prev, firstName: value }));*/}
				{/*			// }}*/}
				{/*		/>*/}
				{/*		<ErrorElement errors={errors}  id={'firstName'}/>*/}

				{/*	</label>*/}

				{/*	/!* Last Name *!/*/}
				{/*	<label className="long">*/}
				{/*		Last name**/}
				{/*		<input*/}
				{/*			type="text"*/}
				{/*			placeholder="Enter your last name"*/}
				{/*			className={`not-react-select long focus-highlight */}
				{/*				${errors.lastName ? "error" : ""}*/}
				{/*				${!errors.lastName && watch('lastName') ? "valid" : ""}`}*/}
				{/*			{...register("lastName")}*/}
				{/*			autoComplete={"off"}*/}
				{/*			value={watch('lastName') || myData.lastName}*/}
				{/*			onBlur={() => trigger('lastName')} // Trigger validation when user leaves the field*/}
				{/*			// onChange={(value) => {*/}
				{/*			// 	setMyData((prev) => ({ ...prev, lastName: value }));*/}
				{/*			// }}*/}
				{/*		/>*/}
				{/*		<ErrorElement errors={errors}  id={'lastName'}/>*/}
				{/*	</label>*/}
				{/*</div>*/}

				{/* todo add changing gender to backend */}
				{/* Gender and Age */}
				{/*<div className='line'>*/}
				{/*	<label className='long'>*/}
				{/*		Gender**/}
				{/*		<Select*/}
				{/*			className={`basic-single long`}*/}
				{/*			classNamePrefix='select'*/}
				{/*			wideMenu={false}*/}
				{/*			name={'gender'}*/}
				{/*			isValid={!errors.gender && watch('gender') !== ''}*/}
				{/*			isError={errors.gender} // Set error if cleared*/}
				{/*			isClearable*/}
				{/*			isSearchable*/}
				{/*			styles={customStyles}*/}
				{/*			menuTop={false}*/}
				{/*			options={genderOptions}*/}
				{/*			placeholder='Select gender'*/}
				{/*			// value={watch('gender') || myData.gender}*/}
				{/*			value={watch('gender')}*/}
				{/*			autoComplete={'off'}*/}
				{/*			onChange={(selectedOption) => {*/}
				{/*				setValue('gender', selectedOption, {shouldValidate: true});  // ✅ Set entire object, not just string*/}
				{/*				// setMyData((prev) => ({ ...prev, gender: selectedOption }));*/}
				{/*				clearErrors('gender');*/}
				{/*			}}*/}

				{/*			onBlur={() => trigger('gender')} // Trigger validation when user leaves the field*/}
				{/*		/>*/}

				{/*		<ErrorElement errors={errors} id={'gender'}/>*/}
				{/*	</label>*/}

					{/* todo add changing age to backend */}
					{/*<label className='long'>*/}
					{/*	Age**/}
					{/*	<div className={'with-button'}>*/}
					{/*		<input*/}
					{/*			id={'age'}*/}
					{/*			type='number'*/}
					{/*			placeholder='Enter your age'*/}
					{/*			className={`not-react-select long focus-highlight */}
					{/*			${errors.age ? 'error' : ''}*/}
					{/*			${!errors.age && watch('age') ? 'valid' : ''}`}*/}
					{/*			{...register('age')}*/}
					{/*			value={watch('age')}*/}
					{/*			autoComplete={'off'}*/}
					{/*			min={0}*/}
					{/*			max={120}*/}
					{/*			onBlur={() => trigger('age')} // Trigger validation when user leaves the field*/}
					{/*			onChange={(e) => {*/}
					{/*				const value = e.target.value ? parseInt(e.target.value, 10) : 0;*/}
					{/*				setValue('age', value, {shouldValidate: true});*/}
					{/*			}}*/}
					{/*		/>*/}
					{/*		<IncrementDecrementButtons id={'age'} watch={watch} setValue={setValue} trigger={trigger}/>*/}
					{/*	</div>*/}

					{/*	<ErrorElement errors={errors} id={'age'}/>*/}
					{/*</label>*/}
				{/*</div>*/}


				{/* step 2 */}
				{/*<div className='form-title'>*/}
				{/*	<h1>Other info</h1>*/}
				{/*</div>*/}

				<CustomSelect
					autoFocus={'on'}
					initallyValid={true}
					data={myData.preferredMusicGenres}
					placeholder={'Preferred music genres'}
					options={genreOptions}
					id={'preferredMusicGenres'}
					name={'genres'}
					register={register}
					watch={watch}
					setValue={setValue}
					trigger={trigger}
					errors={errors}
					setError={setError}
					clearErrors={clearErrors}
				/>

				<CustomSelect
					autoFocus={'on'}
					data={myData.preferredMethod}
					placeholder={'Preferred methods'}
					options={methodsOptions}
					id={'preferredMethod'}
					name={'methods'}
					register={register}
					watch={watch}
					setValue={setValue}
					trigger={trigger}
					errors={errors}
					setError={setError}
					clearErrors={clearErrors}
				/>

				<CustomSelect

					data={myData.additionalInterests}
					placeholder={'Additional interests'}
					options={interestsOptions}
					id={'additionalInterests'}
					name={'interests'}
					register={register}
					watch={watch}
					setValue={setValue}
					trigger={trigger}
					errors={errors}
					setError={setError}
					clearErrors={clearErrors}
				/>

				<CustomSelect
					data={myData.personalityTraits}
					placeholder={'Personality traits'}
					options={personalityTraitsOptions}
					id={'personalityTraits'}
					name={'personality traits'}
					register={register}
					watch={watch}
					setValue={setValue}
					trigger={trigger}
					errors={errors}
					setError={setError}
					clearErrors={clearErrors}
				/>

				<CustomSelect
					data={myData.goalsWithMusic}
					placeholder={'Goals'}
					options={goalsOptions}
					id={'goalsWithMusic'}
					name={'goals'}
					register={register}
					watch={watch}
					setValue={setValue}
					trigger={trigger}
					errors={errors}
					setError={setError}
					clearErrors={clearErrors}
				/>


				{/* step 3 */}
				<div className='form-title'>
					{/*<h1>A little bit more...</h1>*/}
				</div>

				{/* todo valid disappears when cancelled*/}
				<div className={'line'}>
					<label id='experience' className={'short'}>
						Years of music experience*
						<br/>
						<div className={'with-button'}>
							<input
								id={'yearsOfMusicExperience'}
								type='number'
								placeholder='Enter number in years'
								className={`not-react-select long focus-highlight 
								${errors.yearsOfMusicExperience ? 'error' : ''}
								${!errors.yearsOfMusicExperience && (watch('yearsOfMusicExperience') || watch('yearsOfMusicExperience') === 0) ? 'valid' : ''}`}
								{...register('yearsOfMusicExperience')}
								value={watch('yearsOfMusicExperience')}
								autoComplete={'off'}
								min={0}
								max={myData.age}
								onBlur={() => trigger('yearsOfMusicExperience')} // Trigger validation when user leaves the field
								onChange={(e) => {
									const value = e.target.value ? parseInt(e.target.value, 10) : 0;

									if (value > myData.age) {
										setError('yearsOfMusicExperience', 'Years of music experience cannot exceed age');
										setValue('yearsOfMusicExperience', myData.age, {shouldValidate: true});
										return;
									}
									setValue('yearsOfMusicExperience', value, {shouldValidate: true});
								}}
							/>
							<IncrementDecrementButtons id={'yearsOfMusicExperience'} watch={watch} setValue={setValue}
													   trigger={trigger}/>
						</div>

						<ErrorElement errors={errors} id={'yearsOfMusicExperience'}/>
					</label>

					{/* todo can't change and valid disappears when cancelled*/}
					<label id='music' className={'short'}>
						Link to your music
						<br/>
						<input
							type='url'
							id='linkToMusic'
							name={'linkToMusic'}
							className={`not-react-select focus-highlight short
							${errors.linkToMusic ? 'error' : ''}
							${!errors.linkToMusic && watch('linkToMusic') ? 'valid' : ''}`}
							placeholder='Link to your Spotify etc'
							value={watch('linkToMusic')}
							{...register('linkToMusic')}
							autoComplete={'off'}
							onBlur={() => trigger('linkToMusic')} // Trigger validation when user leaves the field
							onChange={(e) => {
								const value = e.target.value;
								setValue('linkToMusic', value, {shouldValidate: true});
							}}
						/>
						<ErrorElement errors={errors} id={'linkToMusic'}/>
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
								setGeoLoading(true);
							}}>
								Current location
							</div>
						</div>

						{!useCurrentLocation ? (
							<Select
								options={options}
								onInputChange={(val) => {
									// setInputValue(val);
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
										// setMyData((prev) => ({...prev, location: null}));
										return;
									}

									fetch(`https://maps.googleapis.com/maps/api/geocode/json?place_id=${selectedOption.value}&key=${GOOGLE_API_KEY}&language=en`)
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

													// setMyData((prev) => ({
													// 	...prev,
													// 	location: locationObj,
													// 	latitude: geometry.location.lat,
													// 	longitude: geometry.location.lng
													// }));
												} else {
													// setMyData((prev) => ({...prev, location: locationObj}));
												}
											}
										})
										.catch(error => console.error('Geocoding error:', error));
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
											Error accessing your location. Please allow location access or use search
											instead.
											<div className='error-details'>{geolocation.error.message}</div>
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
							className={`form-description-container focus-highlight
							${errors.description ? 'error' : ''}
							${!errors.description && watch('description') ? 'valid' : ''}`}
							placeholder='Say a few words about yourself...'
							{...register('description')}
							autoComplete={'off'}
							value={watch('description')}
							onChange={(e) => {
								const value = e.target.value;
								setValue('description', value, {shouldValidate: true});
							}}
						/>
						<ErrorElement errors={errors} id={'description'}/>
					</label>
				</div>
			</form>

			<div className='settings-buttons-container'>
				<button className='cancel' onClick={() => {
					reset();
					closeSettings();
					setGeoLoading(false);
				}} type={'button'}>
					Cancel
				</button>
				<button
					className={`save ${isValid ? '' : 'disabled'}`} // Disabled by default
					onClick={() => {
						closeSettings();
						setGeoLoading(false);
					}}
					type={'submit'}
					form={'dashboard-form'}
					disabled={Object.keys(errors).length > 0}
				>
					Save
				</button>
			</div>
		</>
	);
}
