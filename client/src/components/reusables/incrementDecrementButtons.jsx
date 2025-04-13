import {IoIosArrowDown, IoIosArrowUp} from 'react-icons/io';

// custom increment and decrement buttons for number fields such as age and experience
export function IncrementDecrementButtons({id, watch, setValue, trigger, setFormData}) {
	return (
		<div
			className={'number-buttons'}
			onClick={(e) => {
				e.preventDefault();
				trigger(id);
			}}
		>
			<button
				type={'button'}
				tabIndex={-1}
				className={'number-field increment'}
				onMouseDown={(e) => e.preventDefault()} // Prevents losing focus and triggering validation
				onClick={() => {
					if (document.activeElement.id !== id) {
						document.getElementById(id).focus();
					}
					const currentValue = watch(id) ? parseInt(watch(id)) : 0;
					const newValue = currentValue + 1;
					setValue(id, newValue, {shouldValidate: true});

					if (setFormData) {
						setFormData((prev) => ({...prev, [id]: newValue}));
					}

					console.log(watch(id));
				}}>
				<IoIosArrowUp/>
			</button>
			<button
				type={'button'}
				tabIndex={-1}
				className={'number-field decrement'}
				onMouseDown={(e) => e.preventDefault()} // Prevents losing focus and triggering validation
				onClick={() => {
					if (document.activeElement.id !== id) {
						document.getElementById(id).focus();
					}
					const currentValue = watch(id) ? parseInt(watch(id)) : 0;
					const newValue = Math.max(0, currentValue - 1);
					setValue(id, newValue, {shouldValidate: true});
					if (setFormData) {
						setFormData((prev) => ({...prev, [id]: newValue}));
					}
					console.log(watch(id));
				}}>
				<IoIosArrowDown/>
			</button>
		</div>
	);
}