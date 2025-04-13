// step 5 of registration
import Select from 'react-select';
import {
	genreOptions,
	goalsOptions,
	matchAgeOptions,
	matchExperienceOptions,
	matchGenderOptions,
	matchLocationsOptions,
	methodsOptions
} from '../reusables/inputOptions.jsx';
import {customStyles} from '../reusables/customInputStyles.jsx';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {stepFiveSchema} from './validationSchema.jsx';
import {ErrorElement} from '../reusables/errorElement.jsx';
import {PreviousNextButtons} from '../reusables/previousNextButtons.jsx';

const matchAgeToRange = (age) => {
	age = parseInt(age);
	return matchAgeOptions.find(option => {
		const [min, max] = option.value.split('-').map(Number);
		return age >= min && age <= max;
	});
};

const matchExperienceToRange = (experience) => {
	experience = parseInt(experience);
	return matchExperienceOptions.find(option => {
		const [min, max] = option.value.split('-').map(Number);
		return experience >= min && experience <= max;
	});
};

function Step5({
				   formFiveData, setFormFiveData, formOneData, formTwoData, formThreeData, stepFunctions, Submit,
				   handleCloseMenu, onSubmit
			   }) {


	// Initialize react-hook-form with Yup schema
	const {
		handleSubmit,
		setValue,
		watch,
		clearErrors,
		setError,
		trigger,
		formState: {errors, isValid}
	} = useForm({
		defaultValues: formFiveData,
		resolver: yupResolver(stepFiveSchema(formFiveData)),
		mode: 'onBlur'
	});

	function handleAutoFillData(formFiveData, setFormFiveData, formThreeData, formTwoData, formOneData) {

		const newMatchAge = {...matchAgeToRange(formOneData.age)};
		const newMatchGender = {...formOneData.gender}; // Assuming gender is an object
		const newMatchExperience = {...matchExperienceToRange(formThreeData.experience)};

		setFormFiveData((prev) => ({
			...prev,
			matchPreferredGenres: formTwoData.preferredGenres, // Correctly set the genres as an array of objects
			matchPreferredMethods: formTwoData.preferredMethods, // Same for preferred methods
			matchGoals: formTwoData.goals, // Same for goals
			matchGender: formOneData.gender, // For React Select, use an object with value and label
			matchAge: newMatchAge, // Match the age using predefined options
			matchExperience: newMatchExperience, // Same for experience
			matchLocation: matchLocationsOptions[1] // Same for location
		}));

		setValue('matchPreferredGenres', formTwoData.preferredGenres, {shouldValidate: true});
		setValue('matchPreferredMethods', formTwoData.preferredMethods, {shouldValidate: true});
		setValue('matchGoals', formTwoData.goals, {shouldValidate: true});
		setValue('matchGender', newMatchGender, {shouldValidate: true});
		setValue('matchAge', newMatchAge, {shouldValidate: true});
		setValue('matchExperience', newMatchExperience, {shouldValidate: true});
		setValue('matchLocation', matchLocationsOptions[1], {shouldValidate: true});
		clearErrors();
	}


	return (
		<form className={'step-five'}
			  onSubmit={handleSubmit(async (data) => {
				  await onSubmit(data, formFiveData, setFormFiveData);
				  await Submit(); // Send the data to the database after onSubmit is done
			  })}
			  autoComplete={'off'}
			  noValidate
		>
			<div className='form-title'>
				<h1>Who are you looking for?</h1>
			</div>

			<div className={'like-me-container'}>
				<button
					className='like-me wide narrow'
					type='button'
					onClick={() => {
						handleAutoFillData(formFiveData, setFormFiveData, formThreeData, formTwoData, formOneData);
					}}
				>
					Someone like me
				</button>
			</div>

			<div className={'line large'}>
				<label id='matchPreferredGenres'>
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
						name={'matchPreferredGenres'}
						placeholder='Choose 1-3 genres'
						options={genreOptions}
						isOptionDisabled={() => (watch('matchPreferredGenres') || []).length >= 3}
						styles={customStyles}
						value={formFiveData.matchPreferredGenres || []}
						isValid={!errors.matchPreferredGenres && (watch('matchPreferredGenres') || []).length > 0}
						isError={errors.matchPreferredGenres} // Check if error exists
						onChange={(selectedOption) => {
							setValue('matchPreferredGenres', selectedOption, {shouldValidate: true});
							setFormFiveData((prev) => ({...prev, matchPreferredGenres: selectedOption})); // Persist data correctly
							handleCloseMenu(selectedOption);

							if (!selectedOption || selectedOption.length === 0) {
								setError('matchPreferredGenres', {message: 'Required'});
							} else {
								clearErrors('matchPreferredGenres');
							}
						}}
						onBlur={() => trigger('matchPreferredGenres')} // Trigger validation when user leaves the field
					/>
					<ErrorElement errors={errors} id={'matchPreferredGenres'}/>
				</label>

			</div>

			<div className={'line large'}>
				<label id='matchPreferredMethods'>
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
						name={'matchPreferredMethods'}
						placeholder='Choose 1-3 methods'
						options={methodsOptions}
						isOptionDisabled={() => (watch('matchPreferredMethods') || []).length >= 3}
						styles={customStyles}
						value={formFiveData.matchPreferredMethods || []}
						isValid={!errors.matchPreferredMethods && (watch('matchPreferredMethods') || []).length > 0}
						isError={errors.matchPreferredMethods} // Check if error exists
						onChange={(selectedOption) => {
							setValue('matchPreferredMethods', selectedOption, {shouldValidate: true});
							setFormFiveData((prev) => ({...prev, matchPreferredMethods: selectedOption})); // Persist data correctly
							handleCloseMenu(selectedOption);

							if (!selectedOption || selectedOption.length === 0) {
								setError('matchPreferredMethods', {message: 'Required'});
							} else {
								clearErrors('matchPreferredMethods');
							}
						}}
						onBlur={() => trigger('matchPreferredMethods')} // Trigger validation when user leaves the field
					/>
					<ErrorElement errors={errors} id={'matchPreferredMethods'}/>
				</label>
			</div>
			<div className={'line large'}>
				<label id='matchGoals'>
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
						name={'matchGoals'}
						placeholder='Choose 1-3 goals'
						options={goalsOptions}
						isOptionDisabled={() => (watch('matchGoals') || []).length >= 3}
						styles={customStyles}
						value={formFiveData.matchGoals || []}
						isValid={!errors.matchGoals && (watch('matchGoals') || []).length > 0}
						isError={errors.matchGoals} // Check if error exists
						onChange={(selectedOption) => {
							setValue('matchGoals', selectedOption, {shouldValidate: true});
							setFormFiveData((prev) => ({...prev, matchGoals: selectedOption})); // Persist data correctly
							handleCloseMenu(selectedOption);

							if (!selectedOption || selectedOption.length === 0) {
								setError('matchGoals', {message: 'Required'});
							} else {
								clearErrors('matchGoals');
							}
						}}
						onBlur={() => trigger('matchGoals')} // Trigger validation when user leaves the field
					/>
					<ErrorElement errors={errors} id={'matchGoals'}/>
				</label>
			</div>
			<div className={'line'}>
				<label id='gender' className={'short'}>
					Gender*
					<br/>
					<Select
						className='basic-single short'
						classNamePrefix='select'
						menuWidth='short'
						isClearable={true}
						isSearchable={true}
						name={'matchGender'}
						placeholder='Select gender'
						options={matchGenderOptions}
						styles={customStyles}
						value={formFiveData.matchGender}
						isValid={!errors.matchGender && watch('matchGender')}
						isError={errors.matchGender} // Check if error exists
						onChange={(selectedOption) => {
							setValue('matchGender', selectedOption, {shouldValidate: true});
							setFormFiveData((prev) => ({...prev, matchGender: selectedOption})); // Persist data correctly

							if (!selectedOption || Object.keys(selectedOption).length === 0) {
								setError('matchGender', {message: 'Required'});
							} else {
								clearErrors('matchGender');
							}
						}}
						onBlur={() => trigger('matchGender')} // Trigger validation when user leaves the field
					/>
					<ErrorElement errors={errors} id={'matchGender'}/>
				</label>
				<label id='age' className={'short'}>
					Age*
					<br/>
					<Select
						className='basic-single short'
						classNamePrefix='select'
						menuWidth='short'
						isClearable={true}
						isSearchable={true}
						name={'matchAge'}
						placeholder='Number gap'
						options={matchAgeOptions}
						styles={customStyles}
						value={formFiveData.matchAge}
						isValid={!errors.matchAge && watch('matchAge')}
						isError={errors.matchAge} // Check if error exists
						onChange={(selectedOption) => {
							setValue('matchAge', selectedOption, {shouldValidate: true});
							setFormFiveData((prev) => ({...prev, matchAge: selectedOption})); // Persist data correctly

							if (!selectedOption || Object.keys(selectedOption).length === 0) {
								setError('matchAge', {message: 'Required'});
							} else {
								clearErrors('matchAge');
							}
						}}
						onBlur={() => trigger('matchAge')} // Trigger validation when user leaves the field
					/>
					<ErrorElement errors={errors} id={'matchAge'}/>
				</label>
			</div>

			<div className={'line'}>
				<label id='experience' className={'short'}>
					Experience*
					<br/>
					<Select
						className='basic-single short'
						classNamePrefix='select'
						menuWidth='short'
						isClearable={true}
						isSearchable={true}
						name={'matchExperience'}
						placeholder='In years'
						options={matchExperienceOptions}
						styles={customStyles}
						value={formFiveData.matchExperience}
						isValid={!errors.matchExperience && watch('matchExperience')}
						isError={errors.matchExperience} // Check if error exists
						onChange={(selectedOption) => {
							setValue('matchExperience', selectedOption, {shouldValidate: true});
							setFormFiveData((prev) => ({...prev, matchExperience: selectedOption})); // Persist data correctly

							if (!selectedOption || Object.keys(selectedOption).length === 0) {
								setError('matchExperience', {message: 'Required'});
							} else {
								clearErrors('matchExperience');
							}
						}}
						onBlur={() => trigger('matchExperience')} // Trigger validation when user leaves the field
					/>
					<ErrorElement errors={errors} id={'matchExperience'}/>
				</label>
				<label id='location' className={'short'}>
					Location*
					<br/>
					<Select
						className='basic-single short'
						classNamePrefix='select'
						menuWidth='short'
						isClearable={true}
						isSearchable={true}
						name={'matchLocation'}
						placeholder='Proximity'
						options={matchLocationsOptions}
						styles={customStyles}
						value={formFiveData.matchLocation}
						isValid={!errors.matchLocation && watch('matchLocation')}
						isError={errors.matchLocation} // Check if error exists
						onChange={(selectedOption) => {
							setValue('matchLocation', selectedOption, {shouldValidate: true});
							setFormFiveData((prev) => ({...prev, matchLocation: selectedOption})); // Persist data correctly

							if (!selectedOption || Object.keys(selectedOption).length === 0) {
								setError('matchLocation', {message: 'Required'});
							} else {
								clearErrors('matchLocation');
							}
						}}
						onBlur={() => trigger('matchLocation')} // Trigger validation when user leaves the field
					/>
					<ErrorElement errors={errors} id={'matchLocation'}/>
				</label>

			</div>

			<PreviousNextButtons
				DeductStep={stepFunctions.DeductStep}
				errors={errors}
				isValid={isValid}
				text={'Register'}
			/>
		</form>
	);
}

export default Step5;