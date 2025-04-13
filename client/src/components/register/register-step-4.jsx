// step 4 of registration
import {AdvancedImage} from '@cloudinary/react';
import {getOptimizedImage} from '../utils/cloudinary.jsx';
import {PreviousNextButtons} from '../reusables/previousNextButtons.jsx';
import React, {useState} from 'react';

function Step4({stepFunctions, image, imageUrl, onImageChange}) {
	const [loadingImage, setLoadingImage] = useState(false);

	return (
		<form className={'step-four'}
			  onSubmit={(e) => {
				  stepFunctions.AddStep(e);
				  e.preventDefault();
			  }}
			  autoComplete={'off'}
			  noValidate
		>
			<div className='form-title picture-title'>
				<h1>Add a picture</h1>
			</div>

			{/*todo add ability to move picture, zoom in and out*/}
			<div className={'photo-container'}>

				{loadingImage && (
					<div className='loading-image'>
						<div className={'spinner-container'}>
							<div className='spinner endless'>Loading picture...</div>
						</div>
					</div>
				)}

				{!loadingImage && (
					<>
						{imageUrl && <AdvancedImage cldImg={getOptimizedImage(imageUrl)}/>}
						{!image && <img src={'default_profile_picture.png'} alt={'default picture'}/>}
					</>
				)}

			</div>
			<div className={'submit-picture'}>

				<label className={'choose-picture'}>
					<input type='file'
						   accept={'image/*'}
						   name={'image'}
						   onChange={(event) => onImageChange(event, setLoadingImage)}
						   className='file-upload'/>
					Choose picture
				</label>

			</div>

			<PreviousNextButtons
				DeductStep={stepFunctions.DeductStep}
				errors={{}}
				isValid={{}}
			/>
		</form>
	);
}

export default Step4;