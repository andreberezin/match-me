import './login.scss';
import {Link, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {ShowPasswordButton} from '../reusables/showPasswordButton.jsx';
import {useAuth} from '../utils/AuthContext.jsx';
import {useState} from 'react';

function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('placeholder-error');
	const history = useNavigate();
	const [showPassword, setShowPassword] = useState(true);
	const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

	const {login} = useAuth();

	// login in function
	const handleLogin = async (event) => {
		event.preventDefault();

		try {
			if (!email || !password) {
				setError('Please enter an email and a password');
				return;
			}

			const response = await axios.post(`${VITE_BACKEND_URL}/api/auth/login`, {email, password});
			setError('');
			const token = response.data.payload;
			await login(token);
			// Navigate to dashboard or other protected route
			history('/dashboard');
		} catch (error) {
			setError('Invalid email or password');
			if (error.response) {
				console.error('Backend error:', error.response.data); // Server responded with an error
			} else {
				console.error('Request failed:', error.message); // Network error or request issue
			}
		}
	};

	return (
		<div className='login-container'>
			<form className='login-form'>
				<div className='form-title'>
					<h1>Welcome back!</h1>
					<h2>Enter you credentials to access your account</h2>
				</div>
				<label>
					Email address
					<br/>
					<input
						type='email'
						id='email-input'
						placeholder='Enter your email'
						className={`not-react-select focus-highlight ${error && error !== 'placeholder-error' ? 'error' : ''}`}
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						// autoComplete={'on'}
						autoFocus={true}
						required
					/>
				</label>
				<label id='password-label'>
					Password
					<br/>
					<div className={'with-button'}>
						<input
							type='password'
							id='password-login'
							className={`not-react-select focus-highlight ${error && error !== 'placeholder-error' ? 'error' : ''}`}
							placeholder='Enter your password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							// autoComplete={'on'}
							required
						/>
						<ShowPasswordButton showPassword={showPassword} setShowPassword={setShowPassword} login={true}/>
					</div>

					<Link to='/forgot-password' id='forgot-password' tabIndex={-1}>forgot password?</Link>
					<p className={`error-message ${error && error !== 'placeholder-error' ? 'visible' : 'hidden'}`}>
						{error}
					</p>
				</label>
				{/*<label id='remember-me-label'>*/}
				{/*	<input*/}
				{/*		className={'focus-highlight'}*/}
				{/*		type='checkbox'*/}
				{/*		name='remember'*/}
				{/*		id='remember-me-input'/>*/}
				{/*	&nbsp;*/}
				{/*	/!* todo add functionality to keep token in storage for 30 days *!/*/}
				{/*	Remember for 30 days*/}
				{/*</label>*/}
				<label>
					<button
						className='login-button wide small'
						onClick={handleLogin}
						type={'submit'}
					>
						Login
					</button>
				</label>
				<div id='no-account-label'>
					Don't have an account?
					&nbsp;
					<Link to='/register' tabIndex={-1}>Sign up</Link>
				</div>
			</form>
		</div>
	);
}

export default Login;
