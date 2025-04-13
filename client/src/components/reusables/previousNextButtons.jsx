
// buttons for registration page to move between steps
// eslint-disable-next-line no-unused-vars
export const PreviousNextButtons = ({DeductStep, text = "Next", errors = {}, isValid = {} }, ) => {
	return (
		<div className={'register-buttons-container'}>
			<button
				className='previous wide narrow'
				type={'button'}
				onClick={DeductStep}>
				Previous
			</button>
			<button
				type={'submit'}
				className={`next wide narrow ${!isValid ? 'disabled' : ''}`} // Disabled by default
				disabled={!isValid} // Only enabled when the form is valid
			>
				{text}
			</button>
		</div>
	)
}