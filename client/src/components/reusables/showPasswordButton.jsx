import {FiEye, FiEyeOff} from 'react-icons/fi';
import './showPasswordButton.scss';
import {useCallback, useMemo} from 'react';

// custom button for password fields to hide and show the input
export function ShowPasswordButton({
									   showPassword,
									   setShowPassword,
									   login = false,
									   register = false,
									   changePassword = false
								   }) {


	const passwordIds = useMemo(() => {
		if (login) {
			return ['password-login'];
		}
		if (register) {
			return ['password', 'rePassword'];
		}
		return ['currentPassword', 'newPassword', 'reNewPassword'];
		// eslint-disable-next-line
	}, [login, register, changePassword]);

	const togglePasswordVisibility = useCallback(() => {
		passwordIds.forEach((id) => {
			const input = document.getElementById(id);
			if (input) {
				input.type = input.type === 'password' ? 'text' : 'password';
			}
		});
		setShowPassword((prev) => !prev);
	}, [passwordIds, setShowPassword]);

	return (
		<button
			tabIndex={-1}
			type={'button'}
			className={'show-password'}
			onMouseDown={(e) => e.preventDefault()} // Prevents losing focus and triggering validation
			onClick={togglePasswordVisibility}
		>
			{showPassword ? (<FiEye/>) : (<FiEyeOff/>)}
		</button>
	);
}