import {useCallback, useEffect, useRef, useState} from 'react';
import './chats.scss';
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {useAuth} from '../utils/AuthContext.jsx';
import axios from 'axios';

import {IoMdSend} from 'react-icons/io';
import {IoArrowBack, IoClose} from 'react-icons/io5';

const Chat = ({receiverUsername, receiverUserId, onMessagesRead}) => {
	const [messages, setMessages] = useState([]);
	const [message, setMessage] = useState('');
	const [client, setClient] = useState(null);
	const [userId, setUserId] = useState(null);
	const [isTyping, setIsTyping] = useState(false);
	const [peerIsTyping, setPeerIsTyping] = useState(false);
	const [peerIsOnline, setPeerIsOnline] = useState(false);
	const [typingTimeout, setTypingTimeout] = useState(null);

	const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
	const {isUserLoggedIn, tokenValue} = useAuth();
	const [username, setUsername] = useState('');
	const [beforeId, setBeforeId] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const scrollRef = useRef(null);

	// Fetch chat history
	const fetchChatHistory = useCallback(async (isInitial = false) => {
		if (!receiverUserId || !userId) return;

		try {
			const url = isInitial
				? `${VITE_BACKEND_URL}/api/chat/history/${receiverUserId}?limit=11`
				: `${VITE_BACKEND_URL}/api/chat/history/${receiverUserId}?limit=4&beforeId=${beforeId}`;

			const response = await axios.get(url, {
				headers: {Authorization: `Bearer ${tokenValue}`}
			});

			if (response.data.payload.length === 0) {
				setHasMore(false);
			} else {
				const oldestMessageId = response.data.payload[0]?.id;
				setBeforeId(oldestMessageId);

				setMessages((prev) => {
					// Ensure no duplicate messages when switching
					const newMessages = response.data.payload.filter(msg => !prev.some(m => m.id === msg.id));
					return [...newMessages, ...prev];
				});
			}
		} catch (error) {
			console.error('Error fetching chat history:', error);
		}
	}, [VITE_BACKEND_URL, beforeId, receiverUserId, tokenValue, userId]);

	// Mark messages as read
	const markMessagesAsRead = useCallback(async () => {
		if (!receiverUserId) return;

		try {
			await axios.post(`${VITE_BACKEND_URL}/api/chat/mark-as-read/${receiverUserId}`, {}, {
				headers: {Authorization: `Bearer ${tokenValue}`}
			});

			// Notify parent component that messages are read
			if (onMessagesRead) {
				onMessagesRead(receiverUserId);
			}
		} catch (error) {
			console.error('Error marking messages as read:', error);
		}
	}, [VITE_BACKEND_URL, onMessagesRead, receiverUserId, tokenValue]);

	// Handle typing indicator
	const handleTyping = () => {
		if (client && receiverUserId) {
			// Clear any existing timeout
			clearTimeout(typingTimeout);

			// Only send TYPING status if we weren't already typing
			if (!isTyping) {
				client.publish({
					destination: '/app/status',
					headers: {
						Authorization: `Bearer ${tokenValue}`
					},
					body: JSON.stringify({
						receiverId: receiverUserId,
						status: 'TYPING'
					})
				});
				setIsTyping(true);
			}

			// Set a timeout to clear typing status after 2 seconds of inactivity
			const timeout = setTimeout(() => {
				client.publish({
					destination: '/app/status',
					headers: {
						Authorization: `Bearer ${tokenValue}`
					},
					body: JSON.stringify({
						receiverId: receiverUserId,
						status: 'ACTIVE'
					})
				});
				setIsTyping(false);
			}, 2000);

			setTypingTimeout(timeout);
		}
	};

	// Load messages when receiver changes
	useEffect(() => {
		setMessages([]);
		setBeforeId(0);
		setHasMore(true);
		if (receiverUserId && userId) {
			fetchChatHistory(true).catch(error => console.error('Unhandled error in fetchChatHistory: ', error));
			markMessagesAsRead().catch(error => console.error('Unhandled error in markMessagesAsRead: ', error));
		}
	}, [fetchChatHistory, markMessagesAsRead, receiverUserId, userId]);

	// Call markMessagesAsRead every time the receiverUserId changes (chat switched)
	useEffect(() => {
		if (receiverUserId) {
			markMessagesAsRead().catch(error => console.error('Unhandled error in markMessagesAsRead: ', error));
		}
	}, [receiverUserId, fetchChatHistory, markMessagesAsRead]);

	// handle scroll behavior in chat to fetch more of chat history when scrolling up
	const handleScroll = () => {
		const element = scrollRef.current
		if (!element) return;

		const top = Math.floor(element.scrollTop);
		const height = Math.floor(element.scrollHeight);
		const elementHeight = Math.floor(element.clientHeight);

		if (top + height > elementHeight - 100 && hasMore) {
			fetchChatHistory().catch(error => console.error('Unhandled error in fetchChatHistory: ', error));
		}
	};

	// Fetch user info
	useEffect(() => {
		if (isUserLoggedIn && tokenValue) {
			(async () => {
				try {
					const response = await axios.get(`${VITE_BACKEND_URL}/api/me`,
						{
							headers: {Authorization: `Bearer ${tokenValue}`}
						});
					console.log('Logging in as:', response.data.payload.username);
					setUsername(response.data.payload.username);
					setUserId(response.data.payload.id);
					console.log('user id: ' + response.data.payload.id);
				} catch (error) {
					console.log(error.message);
				}
			})();
		}
	}, [isUserLoggedIn, tokenValue, VITE_BACKEND_URL]);

	// Set up WebSocket connection
	useEffect(() => {
		if (!username) return;

		// Normalize username: Remove spaces and replace them with underscores
		const normalizedUsername = username.trim().replace(/\s+/g, '_');
		console.log(`🔗 Connecting WebSocket for user: ${normalizedUsername}`);
		const socket = new SockJS('/ws'); // Use SockJS
		const stompClient = new Client({
			webSocketFactory: () => socket, // WebSocket factory to use SockJS
			connectHeaders: {
				Authorization: `Bearer ${tokenValue}`
			},
			reconnectDelay: 5000,
			onConnect: () => {
				console.log('Connected to WebSocket');

				// subscribe to private messages for the logged-in user
				stompClient.subscribe(`/user/${normalizedUsername}/queue/messages`, (msg) => {
					const newMsg = JSON.parse(msg.body);
					setMessages((prev) => {
						const exists = prev.some(m => m.id === newMsg.id);
						return exists ? prev : [...prev, newMsg];
					});

					// If this is from the currently active chat, mark it as read
					if (newMsg.senderId === receiverUserId || newMsg.senderUsername === receiverUsername) {
						markMessagesAsRead().catch(error => console.error('Unhandled error in markMessagesAsRead: ', error));
					}
				});

				// Subscribe to status updates
				stompClient.subscribe(`/user/${normalizedUsername}/queue/status`, (statusMsg) => {
					const status = JSON.parse(statusMsg.body);

					// Only process if it's from the currently selected user
					if (status.userId === receiverUserId) {
						if (status.status === 'TYPING') {
							setPeerIsTyping(true);
						} else {
							setPeerIsTyping(false);

							if (status.status === 'ACTIVE') {
								setPeerIsOnline(true);
							} else {
								setPeerIsOnline(false);
							}
						}
					}
				});

				// Send ACTIVE status when connected
				if (receiverUserId) {
					stompClient.publish({
						destination: '/app/status',
						headers: {
							Authorization: `Bearer ${tokenValue}`
						},
						body: JSON.stringify({
							receiverId: receiverUserId,
							status: 'ACTIVE'
						})
					});

					// Mark messages from this sender as read when opening the chat
					markMessagesAsRead().catch(error => console.error('Unhandled error in markMessagesAsRead: ', error));
				}
			}
		});

		stompClient.activate();
		setClient(stompClient);

		// Cleanup function
		return () => {
			if (stompClient.connected && receiverUserId) {
				stompClient.publish({
					destination: '/app/status',
					headers: {
						Authorization: `Bearer ${tokenValue}`
					},
					body: JSON.stringify({
						receiverId: receiverUserId,
						status: 'INACTIVE'
					})
				});
			}
			stompClient.deactivate().catch(error => console.error('Unhandled error in stompClient.deactivate: ', error));
		};
	}, [username, receiverUserId, tokenValue, receiverUsername, markMessagesAsRead]);

	// send message in chat
	const sendMessage = () => {
		if (client && message.trim() && receiverUsername) {
			client.publish({
				destination: '/app/private-message',
				headers: {
					Authorization: `Bearer ${tokenValue}`
				},
				body: JSON.stringify({
					receiverId: receiverUserId,
					content: message
				})
			});

			// Clear the message input
			setMessage('');

			// Clear any typing timeout and reset typing status
			clearTimeout(typingTimeout);
			setIsTyping(false);

			// Explicitly send ACTIVE status to clear typing indicator
			if (client.connected) {
				setTimeout(() => {
					client.publish({
						destination: '/app/status',
						headers: {
							Authorization: `Bearer ${tokenValue}`
						},
						body: JSON.stringify({
							receiverId: receiverUserId,
							status: 'ACTIVE'
						})
					});
				}, 100); // Small delay to ensure message is processed first
			}
		}
	};

	// Handle page visibility change to update active/inactive status - FIXED
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!client || !receiverUserId) return;

			if (document.visibilityState === 'visible') {
				client.publish({
					destination: '/app/status',
					headers: {
						Authorization: `Bearer ${tokenValue}`
					},
					body: JSON.stringify({
						receiverId: receiverUserId,
						status: 'ACTIVE'
					})
				});

				// Also mark messages as read when tab becomes visible again
				markMessagesAsRead().catch(error => console.error('Unhandled error in markMessagesAsRead: ', error));
			}
			// REMOVED: We don't set status to INACTIVE when tab is not visible
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [client, markMessagesAsRead, receiverUserId, tokenValue]);

	// handle key presses in chat so when user is focused on the chat window they can focus the message input field with "Tab" key
	const handleKeyPresses = (event) => {
		const inputMessage = document.getElementById('message-input');

		if (event.key === 'Tab' && inputMessage) {
			if (document.activeElement !== inputMessage) {
				inputMessage.focus();
			}
		}

		// handle key presses in chat so when user is focused on the chat window they can send their message with "Enter" key
		const sendButton = document.getElementById('send-message');

		// send message with "Enter" key
		if (event.key === 'Enter' && sendButton) {
			sendButton.classList.add('active');

			setTimeout(() => {
				sendButton.classList.remove('active');
			}, 100);

			sendMessage();
		}
	};

	// go back to chat connections page (for mobile)
	const backToConnections = () => {
		const connections = document.getElementById('connections');
		const chat = document.getElementById('chat');

		if (!chat || !connections) {
			return;
		}

		connections.classList.add('show-connections');
		connections.classList.remove('hide-connections');
		chat.classList.remove('show-chat');
		chat.classList.add('hide-chat');
	};

	// format time stamp for chat messages
	const formatTimestamp = (timestamp) => {
		const trimmed = timestamp.slice(0, 23);
		const date = new Date(trimmed);
		return date.toLocaleString();
	};

	// handle message input change - trigger typing indicator
	const handleMessageChange = (e) => {
		setMessage(e.target.value);
		handleTyping();
	};

	// for clearing input field
	const clearInput = () => {
		setMessage('');
		clearTimeout(typingTimeout);
		setIsTyping(false);
	};

	return (
		<div className='chat-box' onKeyDown={handleKeyPresses}>
			<div className='heading-container'>
				<button className='toggle-connections' onClick={backToConnections} tabIndex={-1}><IoArrowBack/></button>
				<div className='user-status-container'>
					<h2>{receiverUsername}</h2>
					<div className='status-indicator'>
						{peerIsTyping ? (
							<span className='typing-indicator'>typing...</span>
						) : (
							peerIsOnline && <span className='online-indicator'>online</span>
						)}
					</div>
				</div>
			</div>
			<div className='chat-messages'
				 ref={scrollRef}
				 onScroll={handleScroll}
			>
				{[...messages].reverse().map((msg, index) => (
					<div key={index} className={`message-box ${msg.senderUsername === username ? 'sent' : 'received'}`}>
						<div className='message-content'>{msg.content}</div>
						<div className='timestamp'>{formatTimestamp(msg.timestamp)}</div>
					</div>
				))}
			</div>
			<div className='input-container'>
				<button className='delete-input' type={'button'} onClick={clearInput}><IoClose/></button>
				<textarea
					id={'message-input'}
					value={message}
					onChange={handleMessageChange}
					autoComplete={'off'}
					placeholder='Type a message...'
				/>
				<button id={'send-message'} onClick={sendMessage} tabIndex={-1}><IoMdSend/></button>
			</div>
		</div>
	);
};

export default Chat;
