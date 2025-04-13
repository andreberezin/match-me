
import Select from 'react-select';
import {
	genreOptions,
	goalsOptions,
	matchAgeOptions,
	matchGenderOptions,
	matchExperienceOptions,
	methodsOptions, matchLocationsOptions,
} from '../../reusables/inputOptions.jsx';
import {customStyles} from '../../reusables/customInputStyles.jsx';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {recommendationsFormValidationSchema} from './recommendationsFormValidationSchema.jsx';
import {ErrorElement} from '../../reusables/errorElement.jsx';
import {useAuth} from '../../utils/AuthContext.jsx';
import axios from 'axios';
import {handleCloseMenu} from '../../reusables/handleCloseMenu.jsx';
import {closeSettings} from '../../reusables/profile-card-functions.jsx';
import './distanceSlider.scss'


export function RecommendationsForm({preferencesData, setPreferencesData, setLoading, resetMatches}) {
	const { tokenValue } = useAuth();
	const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

	// Initialize react-hook-form with Yup schema
	const {
		handleSubmit,
		setValue,
		watch,
		clearErrors,
		trigger,
		reset,
		formState: { errors },
	} = useForm({
		defaultValues: preferencesData,
		resolver: yupResolver(recommendationsFormValidationSchema(preferencesData)),
		mode: "onChange",
	});

	// on submit send data to backend
	const Submit = async (formattedData) => {
		console.log("Sending:", JSON.stringify(formattedData, null, 2));
		try {
			await axios.patch(`${VITE_BACKEND_URL}/api/me/bio`, formattedData, {
					headers: {
						Authorization: `Bearer ${tokenValue}`,
						'Content-Type': 'application/json'}

				});

			resetMatches();

		} catch (error) {
			if (error.response) {
				console.error("Backend error:", error.response.data); // Server responded with an error
			} else {
				console.error("Request failed:", error.message); // Network error or request issue
			}
		}
	};

	// Handle max distance change
	const handleMaxDistanceChange = (e) => {
		const value = parseInt(e.target.value, 10);
		setValue('maxMatchRadius', value, { shouldValidate: true });
		setPreferencesData((prev) => ({
			...prev,
			maxMatchRadius: value
		}));
	};

	// on submit send location data to backend
	const SubmitLocation = async (maxMatchRadius) => {

		const locationData = {
			maxMatchRadius: maxMatchRadius
		};

		console.log('Sending:', JSON.stringify(maxMatchRadius, null, 2));

		try {
			await axios.post(`${VITE_BACKEND_URL}/api/me/location`, locationData, {
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


	return (
		<>
		<form className={"recommendations-form"}
			  onSubmit={handleSubmit( (data) => {
				  closeSettings;
				  setLoading(true);

				  setPreferencesData(data);

				  const formattedData = {
					  idealMatchAge: data.idealMatchAge.value,
					  idealMatchGender: data.idealMatchGender.value,
					  idealMatchLocation: data.idealMatchLocation.value,
					  idealMatchYearsOfExperience: data.idealMatchYearsOfExperience.value,
					  idealMatchMethods: data.idealMatchMethods.map(item => item.value),
					  idealMatchGenres: data.idealMatchGenres.map(item => item.value),
					  idealMatchGoals: data.idealMatchGoals.map(item => item.value),
				  }

				  SubmitLocation(data.maxMatchRadius)

				  Submit(formattedData);
			  })}
			  autoComplete={'off'}
			  noValidate
			  id={'recommendations-form'}>
			<div className='form-title'>
				<h1>Who are you looking for?</h1>
			</div>

			{/* Max match radius slider */}
			<div className={'line large radius'}>
				<label id='maxMatchRadius' className={'long'}>
					Maximum matching distance
					<br/>
					<div className="distance-slider-container">
						<input
							type="range"
							min="5"
							max="500"
							step="5"
							value={watch('maxMatchRadius')}
							className="distance-slider"
							onChange={handleMaxDistanceChange}
						/>

					</div>
					<div className="distance-labels">
						<span>5 km</span>
						{/*<div className="distance-value">{watch('maxMatchRadius')} km</div>*/}
						<div className="distance-value">{preferencesData.maxMatchRadius} km</div>
						<span>500 km</span>
					</div>
					<ErrorElement errors={errors} id={'maxMatchRadius'}/>
				</label>
			</div>

			<div className={'line large'}>
				<label id='idealMatchGenres'>
					Which genres should they prefer?*
					<br/>
					<Select
						className='basic-multi-select long'
						classNamePrefix='select'
						closeMenuOnSelect={false}
						isClearable={true}
						isSearchable={true}
						isMulti={true}
						containerExpand={true}
						wideMenu={true}
						name={'idealMatchGenres'}
						placeholder='Choose 1-3 genres'
						options={genreOptions}
						isOptionDisabled={() => (watch('idealMatchGenres') || []).length >= 3}
						styles={customStyles}
						value={watch('idealMatchGenres')}
						isValid={!errors.idealMatchGenres && (watch('idealMatchGenres') || []).length > 0}
						isError={errors.idealMatchGenres} // Check if error exists
						onChange={(selectedOption) => {
							setValue('idealMatchGenres', selectedOption, {shouldValidate: true});
							handleCloseMenu(selectedOption);
						}}
						onBlur={() => trigger(name)} // Trigger validation when user leaves the field
					/>
					<ErrorElement errors={errors}  id={'idealMatchGenres'}/>
				</label>

			</div>

			<div className={'line large'}>
				<label id='idealMatchMethods'>
					How should they make music?*
					<br/>
					<Select
						className='basic-multi-select long'
						classNamePrefix='select'
						closeMenuOnSelect={false}
						isClearable={true}
						isSearchable={true}
						isMulti={true}
						containerExpand={true}
						wideMenu={true}
						name={'idealMatchMethods'}
						placeholder='Choose 1-3 methods'
						options={methodsOptions}
						isOptionDisabled={() => (watch('idealMatchMethods') || []).length >= 3}
						styles={customStyles}
						value={watch('idealMatchMethods')}
						isValid={!errors.idealMatchMethods && (watch('idealMatchMethods') || []).length > 0}
						isError={errors.idealMatchMethods} // Check if error exists
						onChange={(selectedOption) => {
							setValue('idealMatchMethods', selectedOption, {shouldValidate: true});
							handleCloseMenu(selectedOption);
						}}
						onBlur={() => trigger('idealMatchMethods')} // Trigger validation when user leaves the field
					/>
					<ErrorElement errors={errors}  id={'idealMatchMethods'}/>
				</label>
			</div>
			<div className={'line large'}>
				<label id='idealMatchGoals'>
					What should their goals be?*
					<br/>
					<Select
						className='basic-multi-select long'
						classNamePrefix='select'
						closeMenuOnSelect={false}
						isClearable={true}
						isSearchable={true}
						isMulti={true}
						containerExpand={true}
						wideMenu={true}
						name={'idealMatchGoals'}
						placeholder='Choose 1-3 goals'
						options={goalsOptions}
						isOptionDisabled={() => (watch('idealMatchGoals') || []).length >= 3}
						styles={customStyles}
						value={watch('idealMatchGoals')}
						isValid={!errors.idealMatchGoals && (watch('idealMatchGoals') || []).length > 0}
						isError={errors.idealMatchGoals} // Check if error exists
						onChange={(selectedOption) => {
							setValue('idealMatchGoals', selectedOption, {shouldValidate: true});
							handleCloseMenu(selectedOption);
						}}
						onBlur={() => trigger('idealMatchGoals')} // Trigger validation when user leaves the field
					/>
					<ErrorElement errors={errors}  id={'idealMatchGoals'}/>
				</label>
			</div>
			<div className={'line'}>
				<label id='idealMatchGender' className={'short'}>
					Gender*
					<br/>
					<Select
						className='basic-single short'
						classNamePrefix='select'
						menuWidth='short'
						isClearable={true}
						isSearchable={true}
						name={'idealMatchGender'}
						placeholder='Select gender'
						options={matchGenderOptions}
						styles={customStyles}
						value={watch('idealMatchGender')}
						isValid={!errors.idealMatchGender && watch('idealMatchGender')}
						isError={errors.idealMatchGender} // Check if error exists
						onChange={(selectedOption) => {
							setValue('idealMatchGender', selectedOption, {shouldValidate: true});
						}}
						onBlur={() => trigger('idealMatchGender')} // Trigger validation when user leaves the field
					/>
					<ErrorElement errors={errors}  id={'idealMatchGender'}/>
				</label>
				<label id='idealMatchAge' className={'short'}>
					Age*
					<br/>
					<Select
						className='basic-single short'
						classNamePrefix='select'
						menuWidth='short'
						isClearable={true}
						isSearchable={true}
						menuTop={true}
						menuPlacement={'top'}
						name={'idealMatchAge'}
						placeholder='Select age gap'
						options={matchAgeOptions}
						styles={customStyles}
						value={watch('idealMatchAge')}
						isValid={!errors.idealMatchAge && watch('idealMatchAge')}
						isError={errors.idealMatchAge} // Check if error exists
						onChange={(selectedOption) => {
							setValue('idealMatchAge', selectedOption, {shouldValidate: true});
						}}
						onBlur={() => trigger('idealMatchAge')} // Trigger validation when user leaves the field
					/>
					<ErrorElement errors={errors}  id={'idealMatchAge'}/>
				</label>
			</div>

			<div className={'line'}>
				<label id='idealMatchYearsOfExperience' className={'short'}>
					Years of music experience*
					<br/>
					<Select
						className='basic-single short'
						classNamePrefix='select'
						menuWidth='short'
						isClearable={true}
						isSearchable={true}
						menuTop={true}
						menuPlacement={'top'}
						name={'idealMatchYearsOfExperience'}
						placeholder='Select experience'
						options={matchExperienceOptions}
						styles={customStyles}
						value={watch('idealMatchYearsOfExperience')}
						isValid={!errors.idealMatchYearsOfExperience && watch('idealMatchYearsOfExperience')}
						isError={errors.idealMatchYearsOfExperience} // Check if error exists
						onChange={(selectedOption) => {
							setValue('idealMatchYearsOfExperience', selectedOption, {shouldValidate: true});
						}}
						onBlur={() => trigger('idealMatchYearsOfExperience')} // Trigger validation when user leaves the field
					/>
					<ErrorElement errors={errors}  id={'idealMatchYearsOfExperience'}/>
				</label>
				<label id='idealMatchLocation' className={'short'}>
					Location*
					<br/>
					<Select
						className='basic-single short'
						classNamePrefix='select'
						menuWidth='short'
						isClearable={true}
						isSearchable={true}
						menuTop={true}
						menuPlacement={'top'}
						name={'idealMatchLocation'}
						placeholder='Select proximity'
						options={matchLocationsOptions}
						styles={customStyles}
						value={watch('idealMatchLocation')}
						isValid={!errors.idealMatchLocation && watch('idealMatchLocation')}
						isError={errors.idealMatchLocation} // Check if error exists
						onChange={(selectedOption) => {
							setValue('idealMatchLocation', selectedOption);
							clearErrors("idealMatchLocation");
						}}
						onBlur={() => trigger('idealMatchLocation')} // Trigger validation when user leaves the field
					/>
					<ErrorElement errors={errors}  id={'idealMatchLocation'}/>
				</label>

			</div>

		</form>
		<div className='settings-buttons-container'>

			<button className='cancel' type={'button'} onClick={() => {
				reset();
				closeSettings();
			}}>
				cancel
			</button>

			<button className={`save ${Object.keys(errors).length > 0 ? 'disabled' : ''}`} type={'submit'} form={'recommendations-form'} disabled={Object.keys(errors).length > 0} >
				Save
			</button>

		</div>
		</>
	)
}
