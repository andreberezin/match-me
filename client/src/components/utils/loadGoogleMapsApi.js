const GOOGLE_API = import.meta.env.VITE_GOOGLE_API; // Read from.env

// function to load in the Google MAPS script
export function loadGoogleMapsScript() {
	return new Promise((resolve, reject) => {
		if (window.google?.maps?.places) {
			resolve();
			return;
		}

		const existingScript = document.getElementById('google-maps-script');
		if (existingScript) {
			existingScript.onload = () => resolve();
			existingScript.onerror = reject;
			return;
		}

		const script = document.createElement('script');
		script.id = 'google-maps-script';
		script.src = GOOGLE_API;
		script.async = true;
		script.defer = true;
		script.onload = resolve;
		script.onerror = reject;
		document.body.appendChild(script);
	});
}