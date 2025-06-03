import './App.scss';
import {useEffect} from 'react';
import NavigatorGuest from './components/nav-bar-guest/nav-bar-guest.jsx';
import NavigatorUser from './components/nav-bar-user/nav-bar-user.jsx';
import '@fontsource/poppins'; // Defaults to weight 400
import '@fontsource/poppins/400.css'; // Specify weight
import '@fontsource/poppins/400-italic.css'; // Specify weight and style
import {Outlet, useLocation} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from './components/utils/AuthContext.jsx';
import {loadGoogleMapsScript} from './components/utils/loadGoogleMapsApi.js';

function App() {
	const location = useLocation();
	const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
	const {isUserLoggedIn, isLoading} = useAuth();

	// wake up backend when frontend is rendered
	useEffect(() => {
		(async () => {
			try {
				await axios.post(`${VITE_BACKEND_URL}/api/hello-backend`, {
					message: 'Hello from backend'
				});
			} catch (error) {
				console.error('Failed to wake up backend: ' + error.message);
			}
		})();
	});

	// load google API script
	useEffect(() => {
		loadGoogleMapsScript().catch(error => console.error('Unhandled error at loadGoogleMapsScript: ', error));
	}, []);

	const isRegister = location.pathname === '/register';

	if (isLoading) {
		return <div></div>; // Or a nicer loading spinner
	}

	return (
		<div>
			{!isRegister ? (
				isUserLoggedIn ? <NavigatorUser/> : <NavigatorGuest/>
			) : null}
			<Outlet/>
		</div>
	);
}

export default App;
