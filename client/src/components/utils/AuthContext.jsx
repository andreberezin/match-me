import {createContext, useContext, useEffect, useState} from 'react';
import axios from 'axios';
import SockJS from 'sockjs-client';
import {Client} from '@stomp/stompjs';

const AuthContext = createContext();

export function AuthProvider({children}) {
	const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
	const [tokenValue, setTokenValue] = useState('');
	const [serviceTokenValue, setServiceTokenValue] = useState(''); // New state for service token
	const [isLoading, setIsLoading] = useState(true);
	const [username, setUsername] = useState('');
	const [userId, setUserId] = useState(null);
	const [webSocketClient, setWebSocketClient] = useState(null);
	const [imageUrl, setImageUrl] = useState('null');
	const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
	const SERVICE_KEY = import.meta.env.VITE_SERVICE_KEY; // Add this to your .env file

	// Get or refresh the service token
	const getServiceToken = async () => {
		try {
			// Check if we have a cached service token
			/*let cachedToken = sessionStorage.getItem('serviceToken');
			if (cachedToken) {
				setServiceTokenValue(cachedToken);
				return cachedToken;
			}*/

			console.log("Service key: " + SERVICE_KEY);

			// If not, request a new one
			const response = await axios.post(
				`${VITE_BACKEND_URL}/api/auth/service-token`,
				{ email: "service@app.com" }, // Use a service account email
				{
					headers: {
						'X-Service-Key': SERVICE_KEY
					}
				}
			);

			const newToken = response.data.payload;
			// console.log("Service token obtained successfully");
			sessionStorage.setItem('serviceToken', newToken);
			setServiceTokenValue(newToken);
			return newToken;
		} catch (error) {
			console.error('Failed to get service token:', error);
			return null;
		}
	};

	// Fetch data with the appropriate token based on the request type
	const fetchWithToken = async (url, options = {}, useServiceToken = false) => {
		let token;

		if (useServiceToken) {
			// console.log("Using service token for request to:", url);
			token = serviceTokenValue || await getServiceToken();
			if (!token) {
				console.error("Could not obtain service token");
				throw new Error('No service token available');
			}
		} else {
			token = tokenValue;
			if (!token) {
				console.error("No user token available");
				throw new Error('No user token available');
			}
		}

		if (!token) {
			throw new Error('No token available');
		}

		const headers = {
			...(options.headers || {}),
			Authorization: `Bearer ${token}`
		};
		// console.log(`Request to ${url} with token type: ${useServiceToken ? 'SERVICE' : 'USER'}`);
		return axios({
			url: `${VITE_BACKEND_URL}${url}`,
			...options,
			headers
		});
	};

	// mainly to get profile image url
	useEffect(() => {
		const getProfileInfo = async () => {
			// console.log('Getting username and profile picture');

			try {
				// Use user token for personal data
				const response = await fetchWithToken('/api/me');
				setImageUrl(response.data.payload.profilePicture);
			} catch (error) {
				if (error.response) {
					console.error('Backend error:', error.response.data);
				} else {
					console.error('Request failed:', error.message);
				}
			}
		};

		if (tokenValue) {
			getProfileInfo();
		}
	}, [tokenValue]);

	// Function to set up WebSocket connection
	const setupWebSocket = async (token, user) => {
		if (!user || !user.username || !token) return;

		// Normalize username: Remove spaces and replace them with underscores
		const normalizedUsername = user.username.trim().replace(/\s+/g, '_');

		try {
			const socket = new SockJS('/ws');
			const client = new Client({
				webSocketFactory: () => socket,
				connectHeaders: {
					Authorization: `Bearer ${token}`
				},
				reconnectDelay: 5000,
				onConnect: async () => {
					// console.log('Connected to WebSocket in AuthContext');

					// Get all connections first, then broadcast status to each
					await broadcastActiveStatus(client, user.id, token);
				},
				onStompError: (frame) => {
					console.error('WebSocket error:', frame);
				},
				onWebSocketClose: () => {
					console.log('WebSocket closed');
				}
			});

			client.activate();
			setWebSocketClient(client);
			return client;
		} catch (error) {
			console.error('Error setting up WebSocket:', error);
			return null;
		}
	};

	// Function to broadcast ACTIVE status to all connections
	const broadcastActiveStatus = async (client, userId, token) => {
		if (!client || !client.connected || !userId) return;

		try {
			// Get all connections first
			const response = await axios.get(`${VITE_BACKEND_URL}/api/connections`, {
				headers: {Authorization: `Bearer ${token}`}
			});

			const connections = response.data.payload;
			// console.log('Broadcasting ACTIVE status to all connections:', connections);

			// Send ACTIVE status update to each connection
			connections.forEach(connectionId => {
				client.publish({
					destination: '/app/status',
					headers: {
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify({
						receiverId: connectionId,
						status: 'ACTIVE'
					})
				});
				// console.log(`Sent ACTIVE status to user ${connectionId}`);
			});
		} catch (error) {
			console.error('Error broadcasting ACTIVE status:', error);
		}
	};

	// Function to send a specific status to all connections
	const broadcastStatus = async (client, userId, status, token) => {
		if (!client || !client.connected || !userId) return;

		const actualToken = token || tokenValue;
		if (!actualToken) return;

		try {
			// Get all connections first
			const response = await fetchWithToken('/api/connections');

			const connections = response.data.payload;

			// Send status update to each connection
			connections.forEach(connectionId => {
				client.publish({
					destination: '/app/status',
					headers: {
						Authorization: `Bearer ${actualToken}`
					},
					body: JSON.stringify({
						receiverId: connectionId,
						status: status
					})
				});
				console.log(`Sent ${status} status to user ${connectionId}`);
			});
		} catch (error) {
			console.error(`Error broadcasting ${status} status:`, error);
		}
	};

	// Enhanced beforeunload handler to handle tab close
	const handleBeforeUnload = (event) => {
		if (webSocketClient && webSocketClient.connected && userId) {
			// Set a message for some browsers
			event.preventDefault();
			event.returnValue = '';

			// Use synchronous AJAX call to ensure the status update is sent before the page unloads
			// This is more reliable than the WebSocket for unload events
			try {
				const xhr = new XMLHttpRequest();
				xhr.open('POST', `${VITE_BACKEND_URL}/api/chat/status/offline/${userId}`, false); // false for synchronous
				xhr.setRequestHeader('Authorization', `Bearer ${tokenValue}`);
				xhr.setRequestHeader('Content-Type', 'application/json');
				xhr.send(JSON.stringify({status: 'INACTIVE'}));
			} catch (e) {
				console.error('Failed to send offline status on page unload', e);
			}

			// Also try the WebSocket approach as a backup
			try {
				webSocketClient.publish({
					destination: '/app/status/global',
					headers: {
						Authorization: `Bearer ${tokenValue}`
					},
					body: JSON.stringify({
						status: 'INACTIVE'
					})
				});
			} catch (e) {
				console.error('Failed to send WebSocket offline status on page unload', e);
			}
		}
	};

	// validate token
	useEffect(() => {
		const validateToken = async () => {
			setIsLoading(true);
			const token = sessionStorage.getItem('token');

			if (!token) {
				setIsUserLoggedIn(false);
				setIsLoading(false);
				setTokenValue('');
				setUsername('');
				setUserId(null);
				return;
			}

			try {
				await axios.post(
					`${VITE_BACKEND_URL}/api/validateToken`,
					{},
					{headers: {Authorization: `Bearer ${token}`}}
				);

				// Fetch user info
				const userResponse = await axios.get(`${VITE_BACKEND_URL}/api/me`, {
					headers: {Authorization: `Bearer ${token}`}
				});

				const user = userResponse.data.payload;
				setUsername(user.username);
				setUserId(user.id);
				setIsUserLoggedIn(true);
				setTokenValue(token);

				// Set up WebSocket for online status
				await setupWebSocket(token, user);

				// Get a service token
				await getServiceToken();

			} catch (error) {
				console.error('Failed to validate token:', error);
				setIsUserLoggedIn(false);
				sessionStorage.removeItem('token'); // Clear invalid token
				setTokenValue('');
				setUsername('');
				setUserId(null);
			} finally {
				setIsLoading(false);
			}
		};

		validateToken();

		// Set up beforeunload event listener to handle tab/browser close
		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			// Clean up WebSocket connection
			if (webSocketClient) {
				if (webSocketClient.connected && userId) {
					broadcastStatus(webSocketClient, userId, 'INACTIVE');
				}
				webSocketClient.deactivate();
			}
		};
	}, [VITE_BACKEND_URL]);

	// Handle visibility change (tab switching) - FIXED
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!webSocketClient || !webSocketClient.connected || !userId) return;

			if (document.visibilityState === 'visible') {
				// User has returned to the tab - set status to ACTIVE
				broadcastStatus(webSocketClient, userId, 'ACTIVE', tokenValue);
			}
			// IMPORTANT: Don't change the status when the tab is not visible
			// We keep them as ACTIVE for as long as they're logged in
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [webSocketClient, userId, tokenValue]);

	// Heartbeat system to keep track of active users - IMPROVED
	useEffect(() => {
		if (!webSocketClient || !webSocketClient.connected || !userId) return;

		const heartbeatInterval = setInterval(() => {
			try {
				// Send heartbeat to keep the connection alive
				webSocketClient.publish({
					destination: '/app/heartbeat',
					headers: {
						Authorization: `Bearer ${tokenValue}`
					},
					body: '{}'
				});

				// Also rebroadcast ACTIVE status periodically to all connections
				broadcastStatus(webSocketClient, userId, 'ACTIVE', tokenValue);
			} catch (e) {
				console.error('Failed to send heartbeat', e);
			}
		}, 30000); // Every 30 seconds

		return () => {
			clearInterval(heartbeatInterval);
		};
	}, [webSocketClient, userId, tokenValue]);

	const login = async (token) => {
		sessionStorage.setItem('token', token);
		setTokenValue(token);

		try {
			// Fetch user info after login
			const userResponse = await axios.get(`${VITE_BACKEND_URL}/api/me`, {
				headers: {Authorization: `Bearer ${token}`}
			});

			const user = userResponse.data.payload;
			setUsername(user.username);
			setUserId(user.id);
			setIsUserLoggedIn(true);

			// Set up WebSocket and broadcast ACTIVE status
			// The status will be broadcast in the onConnect callback
			await setupWebSocket(token, user);

			// Get a service token
			await getServiceToken();

			// navigate('/dashboard');
		} catch (error) {
			console.error('Error during login process:', error);
		}
	};

	// handle logging out
	const logout = async () => {
		// Broadcast INACTIVE status before logging out
		if (webSocketClient && webSocketClient.connected && userId) {
			await broadcastStatus(webSocketClient, userId, 'INACTIVE', tokenValue);
			webSocketClient.deactivate();
		}

		sessionStorage.removeItem('token');
		sessionStorage.removeItem('serviceToken'); // Clear service token too
		setIsUserLoggedIn(false);
		setTokenValue('');
		setServiceTokenValue('');
		setUsername('');
		setUserId(null);
		setWebSocketClient(null);
	};

	return (
		<AuthContext.Provider value={{
			isUserLoggedIn,
			setIsUserLoggedIn,
			login,
			logout,
			isLoading,
			tokenValue,
			serviceTokenValue,
			fetchWithToken, // Expose the new helper method
			username,
			userId,
			webSocketClient,
			broadcastStatus,
			imageUrl,
			setImageUrl
		}}>
			{children}
		</AuthContext.Provider>
	);
}

// This is the important export that was missing
export function useAuth() {
	return useContext(AuthContext);
}
