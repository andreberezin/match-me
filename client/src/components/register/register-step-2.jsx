import {
	genreOptions,
	goalsOptions,
	interestsOptions,
	methodsOptions,
	personalityTraitsOptions
} from '../reusables/inputOptions.jsx';
import {customStyles} from '../reusables/customInputStyles.jsx';
import Select from 'react-select';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {stepTwoSchema} from './validationSchema.jsx';
import {handleCloseMenu} from '../reusables/handleCloseMenu.jsx';
import {ErrorElement} from '../reusables/errorElement.jsx';
import {PreviousNextButtons} from '../reusables/previousNextButtons.jsx';


export const CustomSelect = ({
								 options,
								 id,
								 name,
								 placeholder,
								 watch,
								 setValue,
								 trigger,
								 errors,
								 setError,
								 clearErrors,
								 setFormTwoData,
								 data
							 }) => {
	return (
		<div className={'line large'}>
			<label id={id}>
				{placeholder}*
				<br/>
				<Select
					className='basic-multi-select long'
					classNamePrefix='select'
					closeMenuOnSelect={false}
					isClearable={true}
					isSearchable={true}
					isMulti={true}
					containerExpand={true}
					menuPlacement={'top'}
					menuTop={true}
					wideMenu={true}
					name={id}
					placeholder={`Choose 1-3 ${name}`}
					options={options}
					isOptionDisabled={() => (watch(id) || []).length >= 3}
					styles={customStyles}
					value={watch(id) || (data ? data : [])}
					isValid={!errors[id] && (watch(id) || (data ? data : [])).length > 0}
					isError={errors[id]} // Check if error exists
					onChange={(selectedOption) => {
						setValue(id, selectedOption, {shouldValidate: true});
						handleCloseMenu(selectedOption);

						if (setFormTwoData) {
							setFormTwoData((prev) => ({...prev, [id]: selectedOption})); // Persist data correctly
						}

						if (!selectedOption || selectedOption.length === 0) {
							setError(id, {message: 'Required'});
						} else {
							clearErrors(id);
						}
					}}
					onBlur={() => trigger(id)} // Trigger validation when user leaves the field
				/>
				<ErrorElement errors={errors} id={id}/>
			</label>

		</div>
	);
};

function Step2({formTwoData, setFormTwoData, stepFunctions, onSubmit}) {

	// Initialize react-hook-form with Yup schema
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		clearErrors,
		setError,
		trigger,
		formState: {errors, isValid}
	} = useForm({
		defaultValues: formTwoData,
		resolver: yupResolver(stepTwoSchema(formTwoData)),
		mode: 'onBlur'
	});

	return (

		<form className='step-two'
			  onSubmit={handleSubmit((data) => {
				  onSubmit(data, formTwoData, setFormTwoData);
			  })}
			  autoComplete={'off'}
			  noValidate>

			<div className='form-title'>
				<h1>Tell us about yourself</h1>
			</div>

			<CustomSelect
				placeholder={'Preferred music genres'}
				options={genreOptions}
				id={'preferredGenres'}
				name={'genres'}
				register={register}
				watch={watch}
				setValue={setValue}
				trigger={trigger}
				errors={errors}
				setError={setError}
				clearErrors={clearErrors}
				setFormTwoData={setFormTwoData}
			/>

			<CustomSelect
				placeholder={'Preferred methods'}
				options={methodsOptions}
				id={'preferredMethods'}
				name={'methods'}
				register={register}
				watch={watch}
				setValue={setValue}
				trigger={trigger}
				errors={errors}
				setError={setError}
				clearErrors={clearErrors}
				setFormTwoData={setFormTwoData}
			/>

			<CustomSelect
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
				setFormTwoData={setFormTwoData}
			/>

			<CustomSelect
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
				setFormTwoData={setFormTwoData}
			/>

			<CustomSelect
				placeholder={'Goals'}
				options={goalsOptions}
				id={'goals'}
				name={'goals'}
				register={register}
				watch={watch}
				setValue={setValue}
				trigger={trigger}
				errors={errors}
				setError={setError}
				clearErrors={clearErrors}
				setFormTwoData={setFormTwoData}
			/>

			<PreviousNextButtons
				DeductStep={stepFunctions.DeductStep}
				errors={errors}
				isValid={isValid}
			/>
		</form>
	);
}

export default Step2;
