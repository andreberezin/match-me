import {uploadToCloudinary} from '../utils/cloudinary.jsx';
import axios from 'axios';

// format data
export const formatData = (data) => {
	for (let i = 0; i < data.length; i++) {
		data[i] = data[i].replaceAll('_', ' ');

		if (i < data.length - 1) {
			data[i] = data[i] + ', ';
		}
	}
	return data;
};

// helped function to format location data (remove "County")
export const formatLocation = (data) => {
	return data.replaceAll(' County', '');
};

// open settings popup
export const openSettings = () => {
	const settingsPopup = document.getElementById('settings-popup');
	settingsPopup.style.display = 'flex';
};

export const changeImage = async (event, setMyDataFormatted, setImage, tokenValue, setLoadingImage) => {
	if (event.target.files && event.target.files[0]) {
		setLoadingImage(true);
		// upload to cloudinary
		const uploadedUrl = await uploadToCloudinary(event.target.files[0]);
		if (uploadedUrl) {
			const publicId = uploadedUrl.split('/').pop().split('.')[0]; // Extract only the public ID
			setMyDataFormatted((prev) => ({
				...prev,
				profilePicture: uploadedUrl
			}));
			setImage(uploadedUrl);
			console.log("Sending picture to backend: "  + publicId);
			await sendPictureToBackend(publicId, tokenValue);
		} else {
			console.log('Failed to upload image.');
		}
	}
	setLoadingImage(false);
};

// function to send profile picture url to the server
export const sendPictureToBackend = async (publicId, tokenValue) => {
	const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

	console.log("Public id: " + publicId);
	try {
		console.log("Sending profilePicture to backend: " + publicId);
		const response = await axios.patch(`${VITE_BACKEND_URL}/api/me`,
			{profilePicture: publicId}, {
				headers: {
					Authorization: `Bearer ${tokenValue}`,
					'Content-Type': 'application/json'
				}
			}
		);
		return response.data.payload;
	} catch (error) {
		if (error.response) {
			console.error('Backend error:', error.response.data); // Server responded with an error
		} else {
			console.error('Request failed:', error.message); // Network error or request issue
		}
	}
};

// close settings popup
export const closeSettings = () => {
	const settingsPopup = document.getElementById('settings-popup');
	settingsPopup.style.display = 'none';
};

// format string to object
export const backToObject = (array, options) => {
	const formattedArray = array.map(item => item.replaceAll(',', '').trim());
	return formattedArray.map(item => options.find(option => option.value === item)).filter(Boolean);
};
