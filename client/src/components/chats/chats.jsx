import './chats.scss';
import Chat from './Chat';
import {useAuth} from '../utils/AuthContext.jsx';
import {useCallback, useEffect, useState} from 'react';
import axios from 'axios';
import {FaBell} from 'react-icons/fa';

function Chats() {
	const [loading, setLoading] = useState(true);
	const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
	const {tokenValue, userId, webSocketClient, broadcastStatus, fetchWithToken} = useAuth();
	const [connections, setConnections] = useState([]);
	const [connectionDetails, setConnectionDetails] = useState([]);
	const [selectedUser, setSelectedUser] = useState(null);
	const [selectedUserId, setSelectedUserId] = useState(null);
	const [error, setError] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [userStatuses, setUserStatuses] = useState({});
	const [unreadMessages, setUnreadMessages] = useState({});
	const [totalUnreadCount, setTotalUnreadCount] = useState(0);
	const [notifications, setNotifications] = useState([]);

	// Fetch unread messages count
	const fetchUnreadCount = useCallback(async () => {
		try {
			const response = await axios.get(`${VITE_BACKEND_URL}/api/chat/unread-count`, {
				headers: {Authorization: `Bearer ${tokenValue}`}
			});
			setTotalUnreadCount(response.data.payload.count);
		} catch (error) {
			console.error('Error fetching unread count:', error);
		}
	}, [VITE_BACKEND_URL, tokenValue]);

	// Fetch notifications (details about unread messages)
	const fetchNotifications = useCallback(async () => {
		try {
			const response = await axios.get(`${VITE_BACKEND_URL}/api/chat/notifications`, {
				headers: {Authorization: `Bearer ${tokenValue}`}
			});
			setNotifications(response.data.payload);

			// Also update unread counts per sender
			const unreadCounts = {};
			response.data.payload.forEach(notification => {
				unreadCounts[notification.senderId] = notification.count;
			});
			setUnreadMessages(unreadCounts);

			// Recalculate total count
			let total = 0;
			Object.values(unreadCounts).forEach(count => {
				total += count;
			});
			setTotalUnreadCount(total);
		} catch (error) {
			console.error('Error fetching notifications:', error);
		}
	}, [VITE_BACKEND_URL, tokenValue]);

	// Helper function to mark messages as read
	const markMessagesAsRead = useCallback(async (senderId) => {
		if (!senderId) return;

		try {
			await axios.post(`${VITE_BACKEND_URL}/api/chat/mark-as-read/${senderId}`, {}, {
				headers: {Authorization: `Bearer ${tokenValue}`}
			});

			// Update local state to show messages as read
			setUnreadMessages(prev => ({
				...prev,
				[senderId]: 0
			}));

			// Refresh notifications and unread count
			await fetchNotifications();
			await fetchUnreadCount();
		} catch (error) {
			console.error('Error marking messages as read:', error);
		}
	}, [VITE_BACKEND_URL, fetchNotifications, fetchUnreadCount, tokenValue]);

	// Fetch user info and subscribe to status updates
	useEffect(() => {
		if (tokenValue && webSocketClient) {
			(async () => {
				try {
					const response = await axios.get(`${VITE_BACKEND_URL}/api/me`, {
						headers: {Authorization: `Bearer ${tokenValue}`}
					});

					// Set up subscription for status updates
					if (webSocketClient && webSocketClient.connected) {
						const normalizedUsername = response.data.payload.username.trim().replace(/\s+/g, '_');

						// Subscribe to status updates for all connections
						webSocketClient.subscribe(`/user/${normalizedUsername}/queue/status`, (statusMsg) => {
							const status = JSON.parse(statusMsg.body);

							setUserStatuses(prev => ({
								...prev,
								[status.userId]: status.status
							}));
						});

						// Subscribe to notifications for unread messages
						webSocketClient.subscribe(`/user/${normalizedUsername}/queue/notifications`, (notificationMsg) => {
							const notification = JSON.parse(notificationMsg.body);

							// If this is from the currently selected user, mark it as read immediately
							if (notification.senderId === selectedUserId) {
								markMessagesAsRead(notification.senderId);
								return;
							}

							// Update the unread messages count for this sender
							setUnreadMessages(prev => ({
								...prev,
								[notification.senderId]: notification.count
							}));

							// Update total unread count
							fetchUnreadCount();

							// Update notifications list
							fetchNotifications();
						});
					}
				} catch (error) {
					console.error(error.message);
				}
			})();
		}
	}, [tokenValue, webSocketClient, selectedUserId, VITE_BACKEND_URL, fetchUnreadCount, fetchNotifications, markMessagesAsRead]);

	// fetch all connections by ids
	useEffect(() => {
		const fetchConnections = async () => {
			try {
				const response = await axios.get(`${VITE_BACKEND_URL}/api/connections`, {
					headers: {Authorization: `Bearer ${tokenValue}`}
				});
				setConnections(response.data.payload);

				// Get user details for all connections
				if (response.data.payload.length > 0) {
					const userDetailsResponse = await fetchWithToken(`/api/getUsersByIds`,
						{
							method: 'POST',
							data: {ids: response.data.payload}
						},
					 true
					);
					setConnectionDetails(userDetailsResponse.data.payload);

					// Initialize status for all connections - default to INACTIVE
					const initialStatuses = {};
					response.data.payload.forEach(connectionId => {
						initialStatuses[connectionId] = 'INACTIVE';
					});
					setUserStatuses(initialStatuses);

					// Explicitly request status updates for all connections
					if (webSocketClient && webSocketClient.connected) {
						response.data.payload.forEach(connectionId => {
							webSocketClient.publish({
								destination: '/app/status/request',
								headers: {
									Authorization: `Bearer ${tokenValue}`
								},
								body: JSON.stringify({
									receiverId: connectionId
								})
							});
						});
					}
				}

				// Fetch unread messages and notifications
				await fetchUnreadCount();
				await fetchNotifications();

			} catch (error) {
				setError(true);
				setErrorMessage(error.message);
				console.error(error.message);
			} finally {
				setLoading(false);
			}
		};

		if (tokenValue) {
			fetchConnections().catch(error => console.error('Unhandled error at fetchConnections: ', error));

			// Also, send our ACTIVE status to all connections when the chat page loads
			if (webSocketClient && webSocketClient.connected && userId) {
				broadcastStatus(webSocketClient, userId, 'ACTIVE', tokenValue);
			}
		}
	}, [VITE_BACKEND_URL, broadcastStatus, fetchNotifications, fetchUnreadCount, fetchWithToken, tokenValue, userId, webSocketClient]);

	// Request status updates periodically
	useEffect(() => {
		const statusRefreshInterval = setInterval(() => {
			if (webSocketClient && webSocketClient.connected && connections.length > 0) {
				// Request status updates for all connections
				connections.forEach(connectionId => {
					webSocketClient.publish({
						destination: '/app/status/request',
						headers: {
							Authorization: `Bearer ${tokenValue}`
						},
						body: JSON.stringify({
							receiverId: connectionId
						})
					});
				});

				// Also broadcast our own status
				if (userId) {
					broadcastStatus(webSocketClient, userId, 'ACTIVE', tokenValue);
				}
			}
		}, 30000); // Every 30 seconds

		return () => clearInterval(statusRefreshInterval);
	}, [webSocketClient, connections, userId, tokenValue, broadcastStatus]);

	// Broadcast our status to all connections
	const handleButtonClick = (userId, username) => {
		const inputMessage = document.getElementById('message-input');

		if (inputMessage) {
			inputMessage.focus();
		}

		// Update active status for the selected user
		if (webSocketClient && webSocketClient.connected) {
			// Set previously selected user to INACTIVE
			if (selectedUserId && selectedUserId !== userId) {
				webSocketClient.publish({
					destination: '/app/status',
					headers: {
						Authorization: `Bearer ${tokenValue}`
					},
					body: JSON.stringify({
						receiverId: selectedUserId,
						status: 'ACTIVE'
					})
				});
			}

			// Set new selected user to ACTIVE
			webSocketClient.publish({
				destination: '/app/status',
				headers: {
					Authorization: `Bearer ${tokenValue}`
				},
				body: JSON.stringify({
					receiverId: userId,
					status: 'ACTIVE'
				})
			});
		}

		// Clear unread messages for this user immediately in the UI
		setUnreadMessages(prev => ({
			...prev,
			[userId]: 0
		}));

		// Update total unread count
		setTotalUnreadCount(prevCount => {
			const currentUnreadCount = unreadMessages[userId] || 0;
			return Math.max(0, prevCount - currentUnreadCount);
		});

		// Call API to mark messages as read
		markMessagesAsRead(userId).catch(error => console.error('Unhandled error at markMessagesAsRead: ', error));

		setSelectedUser(username);
		setSelectedUserId(userId);
	};

	const openChat = () => {
		// open chat
		const connections = document.getElementById('connections');
		const chat = document.getElementById('chat');

		if (!chat || !connections) {
			return;
		}

		connections.classList.remove('show-connections');
		connections.classList.add('hide-connections');
		chat.classList.remove('hide-chat');
		chat.classList.add('show-chat');
	};

	// Render status indicator for connections list
	const renderConnectionStatus = (userId) => {
		const status = userStatuses[userId];

		// Convert status to string if it's an object
		const statusStr = typeof status === 'object' ?
			(status.status || (status.name ? status.name : 'INACTIVE')) : status;

		if (!statusStr || statusStr === 'INACTIVE') {
			return <div className='status-dot offline' title='Offline'></div>;
		}

		if (statusStr === 'TYPING') {
			return <div className='status-dot typing' title='Typing...'></div>;
		}

		if (statusStr === 'ACTIVE') {
			return <div className='status-dot online' title='Online'></div>;
		}

		return <div className='status-dot offline' title='Offline'></div>;
	};

	// Render unread message count badge
	const renderUnreadBadge = (userId) => {
		const count = unreadMessages[userId];
		if (!count || count <= 0) return null;

		return (
			<div className='unread-badge' title={`${count} unread message${count > 1 ? 's' : ''}`}>
				{count > 99 ? '99+' : count}
			</div>
		);
	};

	// Handle messages read callback from Chat component
	const handleMessagesRead = (userId) => {
		// Messages were marked as read in the Chat component
		// Update local state to reflect this
		setUnreadMessages(prev => ({
			...prev,
			[userId]: 0
		}));

		// Update total count
		fetchUnreadCount().catch(error => console.error('Unhandled error at fetchUnreadCount: ', error));
	};

	return (
		<div className='chats-container'>
			{/* Add total unread count in the header if needed */}
			{totalUnreadCount > 0 && (
				<div className='total-unread-badge'>
					<FaBell/>
					<span>{totalUnreadCount}</span>
				</div>
			)}

			{!error ? (
				<>
					{loading && (
						<div className={'spinner-container'}>
							<div className='spinner endless'>Loading chats...</div>
						</div>
					)}

					{!loading && (
						<div className='extra-chats-container'>
							<div className='connections' id={'connections'}>
								{connectionDetails.length === 0 ? (
									<p className={'no-connections-message'}>No connections</p>
								) : (
									connectionDetails.map((connection) => (
										<button
											className={`picture-name-button ${selectedUserId === connection.id ? 'selected' : ''}`}
											key={connection.id} onClick={() => {
											handleButtonClick(connection.id, connection.username);
											openChat();
										}}>
											<div className='connection-info'>
													{connection.profilePicture && !connection.profilePicture.endsWith('null') ? (
														<img src={connection.profilePicture} alt={connection.username} className='connection-pic'/>
													) : (
														<img src='default_profile_picture.png' alt={connection.username}
															 className='connection-pic'/>
													)
													}
												{/*<img src={connection.id.profilePicture} alt='' className='profile-picture'/>*/}
												<div className='name'>{connection.username}</div>
											</div>
											<div className='connection-indicators'>
												{renderUnreadBadge(connection.id)}
												{renderConnectionStatus(connection.id)}
											</div>
										</button>
									))
								)}
							</div>

							<div className='chat' id={'chat'}>
								{selectedUser ? (
									<Chat
										receiverUsername={selectedUser}
										receiverUserId={selectedUserId}
										onMessagesRead={handleMessagesRead}
									/>
								) : (
									<p className={'no-chat'}>
										Select a user to start chatting
										{notifications.length > 0 && (
											<div className='unread-notifications'>
												<h3>Unread Messages</h3>
												{notifications.map(notification => (
													<div
														key={notification.messageId}
														className='notification-item'
														onClick={() => {
															const user = connectionDetails.find(c => c.id === notification.senderId);
															if (user) {
																handleButtonClick(user.id, user.username);
																openChat();
															}
														}}
													>
														<div
															className='notification-sender'>{notification.senderUsername}</div>
														<div
															className='notification-preview'>{notification.messagePreview}</div>
														<div className='notification-count'>{notification.count}</div>
													</div>
												))}
											</div>
										)}
									</p>
								)}
							</div>
						</div>
					)}
				</>
			) : (
				<div className='api-error'>{errorMessage}</div>
			)}
		</div>
	);
}

export default Chats;
