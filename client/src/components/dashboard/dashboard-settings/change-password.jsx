import {closeSettings} from '../../reusables/profile-card-functions.jsx';
import {IoClose} from 'react-icons/io5';
import {useState} from 'react';
import './change-password.scss';
import {ShowPasswordButton} from '../../reusables/showPasswordButton.jsx';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {passwordValidationSchema} from './passwordValidationSchema.jsx';
import {ErrorElement} from '../../reusables/errorElement.jsx';
import axios from 'axios';
import {useAuth} from '../../utils/AuthContext.jsx';

// change password page of /dashboard settings
export function ChangePassword() {
	const [showPassword, setShowPassword] = useState(true);
	const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
	const {tokenValue} = useAuth();

	// Initialize react-hook-form with Yup schema
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		setError,
		clearErrors,
		trigger,
		formState: {errors, isValid}
	} = useForm({
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			reNewPassword: ''
		},
		resolver: yupResolver(passwordValidationSchema),
		mode: 'onChange'
	});

	const checkPassword = async () => {
		try {
			const passwordMatch = await axios.post(`${VITE_BACKEND_URL}/api/check-password`, {
					password: watch('currentPassword')
				},
				{
					headers: {Authorization: `Bearer ${tokenValue}`}
				});

			console.log('PasswordMatch: ', passwordMatch);

			if (passwordMatch.data.payload === 'Password matches.') {
				clearErrors('currentPassword');
			}
		} catch (error) {
			if (error.response) {
				console.error('Backend error:', error.response.data); // Server responded with an error
				setError('currentPassword', {
					type: 'manual',
					message: 'Does not match your password'
				});
			} else {
				console.error('Request failed:', error.message); // Network error or request issue
			}
		}
	};

	const updatePassword = async () => {
		console.log('UpdatePassword function');
		try {
			await axios.patch(`${VITE_BACKEND_URL}/api/change-password`, {
					oldPassword: watch('currentPassword'),
					newPassword: watch('newPassword')
				},
				{
					headers: {Authorization: `Bearer ${tokenValue}`}
				});

			reset();
			clearErrors(); // trigger form validation
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
			<button
				className='close-settings'
				type={'button'}
				onClick={closeSettings}
			>
				<IoClose/>
			</button>
			<div className='change-password-content'>
				{/* todo add animation to show users password change was successful (like an animated checkmark)*/}
				<form
					className={'change-password-form'}
					id={'change-password-form'}
					autoComplete={'off'}
					noValidate
					onSubmit={handleSubmit(() => {
						updatePassword().catch(error => console.error('Unhandled error at updatePassword: ', error));
						reset();
					})}
				>

					<div className='form-title'>
						<h1>Change password</h1>
					</div>

					<label>
						Current password
						<br/>
						<div className={'with-button'}>
							<input
								type='password'
								id='currentPassword'
								placeholder='Enter your current password'
								value={watch('currentPassword')}
								className={`not-react-select focus-highlight 
									${errors.currentPassword ? 'error' : ''}
									${!errors.currentPassword && watch('currentPassword') ? 'valid' : ''}`}
								{...register('currentPassword')}
								autoComplete={'off'}
								onBlur={() => {
									checkPassword().catch(error => console.error('Unhandled error at checkPassword: ', error));
								}}
							/>
							<ShowPasswordButton showPassword={showPassword} setShowPassword={setShowPassword}
												changePassword={true}/>
						</div>
						<ErrorElement errors={errors} id={'currentPassword'}/>

					</label>
					<label>
						New password
						<br/>
						<div className={'with-button'}>
							<input
								type='password'
								id='newPassword'
								placeholder='Enter a new password'
								value={watch('newPassword')}
								className={`not-react-select focus-highlight 
									${errors.newPassword ? 'error' : ''}
									${!errors.newPassword && watch('newPassword') ? 'valid' : ''}`}
								{...register('newPassword')}
								autoComplete={'off'}
								onChange={(e) => {
									setValue('newPassword', e.target.value, {shouldValidate: true}); // Manually update field value
									void trigger('reNewPassword'); // Trigger validation for reNewPassword
								}}
							/>
							<ShowPasswordButton showPassword={showPassword} setShowPassword={setShowPassword}
												changePassword={true}/>
						</div>

						<ErrorElement errors={errors} id={'newPassword'}/>

					</label>
					<label>
						New password again
						<br/>
						<div className={'with-button'}>
							<input
								type='password'
								id='reNewPassword'
								placeholder='Enter the new password again'
								value={watch('reNewPassword')}
								className={`not-react-select focus-highlight 
									${errors.reNewPassword ? 'error' : ''}
									${!errors.reNewPassword && watch('reNewPassword') ? 'valid' : ''}`}
								{...register('reNewPassword')}
								autoComplete={'off'}
							/>
							<ShowPasswordButton showPassword={showPassword} setShowPassword={setShowPassword}
												changePassword={true}/>
						</div>

						<ErrorElement errors={errors} id={'reNewPassword'}/>

					</label>
				</form>
				<div className='settings-buttons-container'>
					<button className='cancel' onClick={() => {
						reset();
						closeSettings();
					}} type={'button'}>
						Cancel
					</button>
					<button
						// className={`save ${Object.keys(errors).length > 0 ? 'disabled' : ''}`}
						className={`save ${!isValid ? 'disabled' : ''}`} // Disabled by default
						disabled={!isValid} // Only enabled when the form is valid
						type={'submit'}
						form={'change-password-form'}
						onClick={closeSettings}
						// disabled={Object.keys(errors).length > 0}
					>
						Save
					</button>
				</div>
			</div>
		</>
	);
}
