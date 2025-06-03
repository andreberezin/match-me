import {Cloudinary} from '@cloudinary/url-gen';
import {auto} from '@cloudinary/url-gen/actions/resize';
import {autoGravity} from '@cloudinary/url-gen/qualifiers/gravity';

// Initialize Cloudinary instance
const cld = new Cloudinary({
	cloud: {
		cloudName: 'djfqpfthj' // Replace with your Cloudinary cloud name
	}
});

// Function to get an optimized Cloudinary image
export const getOptimizedImage = (imageId) => {
	return cld
		.image(imageId)
		.format('auto')  // Auto-format (WebP, PNG, etc.)
		.quality('auto') // Auto-optimize quality
		.resize(auto().gravity(autoGravity()).width(500).height(500)); // Resize to 500x500
};

const uploadToCloudinary = async (file) => {
	const cloudName = 'djfqpfthj';
	const uploadPreset = 'profile_pictures_upload';

	// prepare form data
	const formData = new FormData();
	formData.append('file', file);
	formData.append('upload_preset', uploadPreset); // required for unsigned uploads

	try {
		const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			console.error('Cloudinary upload failed');
		}
		
		const data = await response.json();
		return data.secure_url; // this is the cloudinary image url
	} catch (error) {
		console.error('Error uploading to cloudinary:', error);
		return null;
	}
};

export {uploadToCloudinary};
