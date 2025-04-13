import Select from 'react-select';
import {genderOptions} from '../reusables/inputOptions.jsx';
import {customStyles} from '../reusables/customInputStyles.jsx';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {stepOneSchema} from './validationSchema.jsx';
import {ErrorElement} from '../reusables/errorElement.jsx';
import axios from 'axios';
import React, {useState} from 'react';
import {IncrementDecrementButtons} from '../reusables/incrementDecrementButtons.jsx';
import {ShowPasswordButton} from '../reusables/showPasswordButton.jsx';
import '../reusables/settings-popup.scss';
import {closeSettings, openSettings} from '../reusables/profile-card-functions.jsx';
import {IoClose} from 'react-icons/io5';


function Step1({formOneData, setFormOneData, onSubmit}) {
	const [showPassword, setShowPassword] = useState(true);

	const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;


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
		defaultValues: formOneData,
		resolver: yupResolver(stepOneSchema(formOneData)),
		mode: 'onChange'
	});

	const loremText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin a commodo nibh. Donec laoreet mauris quam, posuere posuere purus viverra eget. Curabitur feugiat felis ligula, a placerat erat venenatis quis. In vel viverra odio. Quisque vel turpis lacinia, pulvinar est viverra, sollicitudin nulla. Etiam semper lectus lacus, in consectetur turpis pellentesque vitae. Praesent vehicula sollicitudin convallis. Fusce lobortis sapien eu quam pharetra, non vehicula lorem accumsan. Vivamus in augue quis orci pharetra laoreet. Vestibulum malesuada venenatis ligula, eu sagittis orci dictum at. Nunc cursus posuere mauris eget egestas. Sed hendrerit arcu mattis, eleifend odio a, cursus felis. Vestibulum eu libero mattis, pellentesque mauris ut, vestibulum nunc. Vestibulum id lacinia sapien.\n' +
		'\n' +
		'In ut nibh a ligula tincidunt mattis a a nisl. Nunc enim metus, posuere at nisl ut, ullamcorper sagittis lectus. Nulla ornare nunc sed mauris tempor mollis. Donec placerat, urna ac volutpat suscipit, orci diam euismod mi, eget commodo leo purus nec neque. Phasellus egestas nisl eget urna luctus, sollicitudin faucibus odio eleifend. Donec eu fringilla elit. Nulla sed elementum nulla. Curabitur et magna egestas, tristique odio id, consectetur nibh. Vestibulum hendrerit vel mauris ac facilisis.\n' +
		'\n';

	return (
		<>
			<div className='settings-popup' id='settings-popup'>
				<div className='settings-content'>
					<button className='close-settings' type={'button'} onClick={() => {
						closeSettings();
					}}><IoClose/></button>

					<div className='tc-container'>
						<h1>Terms and conditions</h1>
						<p>{loremText}</p>

					</div>
				</div>

			</div>


			<form className='step-one'
				  onSubmit={handleSubmit((data) => {
					  onSubmit(data, formOneData, setFormOneData);
					  console.log('Errors on submit: ', errors);
				  })}
				  autoComplete={'off'}
				  noValidate>
				<div className='form-title'>
					<h1>Get started!</h1>
				</div>

				{/* First Name */}
				<div className='line'>
					<label className='short'>
						First name*
						<input
							type='text'
							placeholder='Enter first name'
							className={`not-react-select short focus-highlight 
								${errors.firstName ? 'error' : ''}
								${!errors.firstName && watch('firstName') ? 'valid' : ''}`}
							{...register('firstName')}
							autoComplete={'off'}
							onBlur={() => trigger('firstName')} // Trigger validation when user leaves the field
						/>
						<ErrorElement errors={errors} id={'firstName'}/>

					</label>

					{/* Last Name */}
					<label className='short'>
						Last name*
						<input
							type='text'
							placeholder='Enter last name'
							className={`not-react-select short focus-highlight 
								${errors.lastName ? 'error' : ''}
								${!errors.lastName && watch('lastName') ? 'valid' : ''}`}
							{...register('lastName')}
							autoComplete={'off'}
							onBlur={() => trigger('lastName')} // Trigger validation when user leaves the field
						/>
						<ErrorElement errors={errors} id={'lastName'}/>
					</label>
				</div>

				{/* Gender and Age */}
				<div className='line'>
					<label className='short'>
						Gender*
						<Select
							className={`basic-single short`}
							classNamePrefix='select'
							menuWidth='short'
							name={'gender'}
							isValid={!errors.gender && watch('gender') !== ''}
							isError={errors.gender} // Set error if cleared
							isClearable
							isSearchable
							styles={customStyles}
							options={genderOptions}
							placeholder='Select gender'
							value={watch('gender')}
							autoComplete={'off'}
							onChange={(selectedOption) => {
								if (!selectedOption) {
									setValue('gender', '');  // Clear value when selection is cleared
								} else {
									setValue('gender', selectedOption);
									clearErrors('gender');
								}
							}}
							onBlur={() => trigger('gender')} // Trigger validation when user leaves the field
						/>

						<ErrorElement errors={errors} id={'gender'}/>
					</label>

					<label className='short'>
						Age*
						<div className={'with-button'}>
							<input
								id={'age'}
								type='number'
								placeholder='Enter age'
								className={`not-react-select short focus-highlight 
									${errors.age ? 'error' : ''}
									${!errors.age && watch('age') ? 'valid' : ''}`}
								{...register('age')}
								autoComplete={'off'}
								min={0}
								max={120}
								onBlur={() => trigger('age')} // Trigger validation when user leaves the field
							/>
							<IncrementDecrementButtons id={'age'} watch={watch} setValue={setValue} trigger={trigger}
													   setFormData={setFormOneData}/>
						</div>

						<ErrorElement errors={errors} id={'age'}/>
					</label>
				</div>

				{/* Email */}
				<div className='line large'>
					<label>
						Email address*
						<input
							type='email'
							placeholder='Enter email address'
							className={`not-react-select focus-highlight 
								${errors.email ? 'error' : ''}
								${!errors.email && watch('email') ? 'valid' : ''}`}
							{...register('email')}
							autoComplete={'off'}
							onBlur={async () => {
								// check if email is already in use
								if (watch('email')) {
									try {
										const response = await
											axios.post(`${VITE_BACKEND_URL}/api/check-email`, {email: watch('email')});
										if (response.data.payload.exists) {
											setError('email', {type: 'manual', message: 'Email is already in use'});
											return;
										}
									} catch (error) {
										console.log('Failed to request data from backend: ', error.response?.data || error.message);
										setError('email', {
											type: 'manual',
											message: 'Oops! Failed to check email availability'
										});
									}
									await trigger('email');
								}
								trigger('email');
							}}
						/>
						<ErrorElement errors={errors} id={'email'}/>
					</label>
				</div>

				{/* Password */}
				<div className='line large'>
					<label>
						Password*
						<div className={'with-button'}>
							<input
								id={'password'}
								type='password'
								placeholder='Enter a password'
								className={`not-react-select focus-highlight
									${errors.password ? 'error' : ''}
									${!errors.password && watch('password') ? 'valid' : ''}`}
								{...register('password')}
								autoComplete={'off'}
								onBlur={() => trigger('password')} // Trigger validation when user leaves the field
							/>
							<ShowPasswordButton showPassword={showPassword} setShowPassword={setShowPassword}
												register={true}/>
						</div>
						<ErrorElement errors={errors} id={'password'}/>
					</label>

				</div>

				{/* Confirm Password */}
				<div className='line large'>
					<label>
						Re-enter password*
						<input
							id={'rePassword'}
							type='password'
							placeholder='Re-enter password'
							className={`not-react-select focus-highlight 
								${errors.rePassword ? 'error' : ''}
								${!errors.rePassword && watch('rePassword') ? 'valid' : ''}`}
							{...register('rePassword')}
							autoComplete={'off'}
							onBlur={() => trigger('rePassword')} // Trigger validation when user leaves the field
						/>
						<ErrorElement errors={errors} id={'rePassword'}/>
					</label>

				</div>

				{/* Terms and Conditions */}
				<label id='tc-label'>
					<input
						className={`focus-highlight 
							${errors.terms ? 'error-checkbox' : ''}`}
						type='checkbox'
						id='tc-input'
						{...register('terms')}
						onBlur={() => trigger('terms')} // Trigger validation when user leaves the field
					/>
					&nbsp; I agree to the &nbsp;
					<button className='tc' type={'button'} onClick={openSettings}> terms and conditions</button>
					*
				</label>
				<div className={'terms-error'}>
					<ErrorElement errors={errors} id={'terms'}/>
				</div>

				{/* Submit Button */}
				<div className='register-buttons-container'>
					<button
						type='submit'
						className={`next wide small ${!isValid ? 'disabled' : ''}`} // Disabled by default
						disabled={!isValid} // Only enabled when the form is valid
					>
						Next
					</button>
				</div>
			</form>

		</>
	);
}


export default Step1;
