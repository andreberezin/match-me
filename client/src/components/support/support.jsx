import './support.scss';
import {useState} from 'react';

function Support() {
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	const [error, setError] = useState('placeholder-error');

	const handleSubmit = (event) => {
		event.preventDefault();
		if (!email && !message) {
			setError('Please enter a message and an email');
			return;
		}
		if (!email && message) {
			setError('Please enter an email');
			return;
		}

		if (email && !message) {
			setError('Please enter a message');
			return;
		}
		if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
			setError('Please enter a valid email');
			return;
		}
		setError('');
		setEmail('');
		setMessage('');
	};

	return (
		<>
			<div className='support-container'>
				<div className='support-form'>
					<form
						autoComplete={'off'}
						noValidate={true}
						onSubmit={handleSubmit}>
						<label id={'support'}>
							What&#39;s on your mind?
							<textarea
								maxLength={300}
								id='support'
								className={`not-react-select focus-highlight ${error && error !== 'placeholder-error' ? 'error' : ''}`}
								placeholder={'Tell us about your problem...'}
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								autoFocus={true}
							/>
						</label>
						<label id={'email'}>
							Your email*
							<input
								type='email'
								id='email'
								className={`not-react-select focus-highlight ${error && error !== 'placeholder-error' ? 'error' : ''}`}
								placeholder={'Enter your email'}
								value={email}
								onChange={(e) => setEmail(e.target.value)}/>
						</label>
						<p className={`error-message ${error && error !== 'placeholder-error' ? 'visible' : 'hidden'}`}>
							{error}
						</p>
						<label>
							<button
								className='submit-button wide small'
								type={'submit'}
							>
								Submit
							</button>
						</label>
					</form>
				</div>
			</div>
		</>

	);
}

export default Support;