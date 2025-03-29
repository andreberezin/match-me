import React, {useState, useEffect, useRef} from "react";
import './chats.scss'
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
/*import {useAuth} from "../../AuthContext.jsx";*/
import { useAuth } from '../utils/AuthContext.jsx';
import axios from "axios";

import { IoMdSend } from "react-icons/io";
import {IoArrowBack} from 'react-icons/io5';

/*var stompClient = null;*/

const Chat = ({receiverUsername, receiverUserId}) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [client, setClient] = useState(null);
    const [userId, setUserId] = useState(null);
    /*const [privateMessage, setPrivateMessage] = useState(new Map());
    const [publicMessage, setPublicMessage] = useState([]);
    const [chatArea, setChatArea] = useState("PUBLIC");
    const [userData, setUserData] = useState({
        username: "",
        receivername: "",
        message: "",
        connected: false,
    });*/

    const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const { isUserLoggedIn, tokenValue } = useAuth();
    const [username, setUsername] = useState("");
    const [beforeId, setBeforeId] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const scrollRef = useRef();

        // const fetchChatHistory = async (isInitial = false) => {
        //     if(!receiverUserId || !userId || !hasMore) return;
        //     try {
        //         const url = isInitial
        //             ? `${VITE_BACKEND_URL}/api/chat/history/${receiverUserId}?limit=11`
        //             : `${VITE_BACKEND_URL}/api/chat/history/${receiverUserId}?limit=4&beforeId=${beforeId}`;
        //         const response = await axios.get(url, {
        //             headers: {Authorization: `Bearer ${tokenValue}`},
        //         });
        //
        //         if(response.data.length === 0) {
        //             setHasMore(false);
        //         } else {
        //             const oldestMessageId = response.data[0]?.id;
        //             setBeforeId(oldestMessageId);
        //             console.log("Fetched chat history:", response.data);
        //             setMessages((prev) => [...response.data, ...prev]);
        //         }
        //     } catch (error) {
        //         console.log(error);
        //     }
        // }

    // fetch chat history
    // todo add message when no more history is available
    const fetchChatHistory = async (isInitial = false) => {
        if (!receiverUserId || !userId) return;

        try {
            const url = isInitial
                ? `${VITE_BACKEND_URL}/api/chat/history/${receiverUserId}?limit=11`
                : `${VITE_BACKEND_URL}/api/chat/history/${receiverUserId}?limit=4&beforeId=${beforeId}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${tokenValue}` },
            });

            if (response.data.length === 0) {
                setHasMore(false);
            } else {
                const oldestMessageId = response.data[0]?.id;
                setBeforeId(oldestMessageId);

                setMessages((prev) => {
                    // Ensure no duplicate messages when switching
                    const newMessages = response.data.filter(msg => !prev.some(m => m.id === msg.id));
                    return [...newMessages, ...prev];
                });
            }
        } catch (error) {
            console.error("Error fetching chat history:", error);
        }
    };


    useEffect(() => {
        setMessages([]);
        setBeforeId(0);
        setHasMore(true);
        if (receiverUserId && userId) {
            fetchChatHistory(true);
        }
    }, [receiverUserId, userId]);

    // handle scroll behavior in chat to fetch more of chat history when scrolling up
    // todo fetch more history sooner so user doesn't have to wait for them to load
    const handleScroll = () => {
        const top = Math.floor(scrollRef.current.scrollTop);
        const height = Math.floor(scrollRef.current.scrollHeight);
        const elementHeight = Math.floor(scrollRef.current.clientHeight);

        if (top + height > elementHeight - 100 && hasMore) {
            fetchChatHistory();
        }
    };

    // const handleScroll = () => {
    //     if (!scrollRef.current) return;
    //
    //     const scrollTop = scrollRef.current.scrollTop;
    //
    //     if (scrollTop === 0 && hasMore) {
    //         const prevHeight = scrollRef.current.scrollHeight; // Store previous height
    //
    //         fetchChatHistory().then(() => {
    //             // Restore scroll position after new messages are prepended
    //             requestAnimationFrame(() => {
    //                 scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
    //             });
    //         });
    //     }
    // };

    useEffect(() => {
        if(isUserLoggedIn && tokenValue) {
            const fetchUsername =  async () => {
                try {
                    const response = await axios.get(`${VITE_BACKEND_URL}/api/me`,
                        {
                        headers: { Authorization: `Bearer ${tokenValue}` },
                    });
                    console.log("Logging in as:", response.data.username);
                    setUsername(response.data.username);
                    setUserId(response.data.id);
                    console.log("user id: " + response.data.id);
                } catch (error) {
                    console.log(error.message);
                }
            }
            fetchUsername();
        }
    }, [isUserLoggedIn, tokenValue]);

   /* const registerUser = () => {
        connect();
    };*/

   /* const connect = () => {
        let sock = new SockJS("http://localhost:8080/ws");
        stompClient = over(sock);
        stompClient.connect({}, onConnected, onError);
    };*/


    useEffect(() => {
        if (!username) return;

        // Normalize username: Remove spaces and replace them with underscores
        const normalizedUsername = username.trim().replace(/\s+/g, "_");
        console.log(`🔗 Connecting WebSocket for user: ${normalizedUsername}`);
        const socket = new SockJS("/ws"); // Use SockJS
        const stompClient = new Client({
            webSocketFactory: () => socket, // WebSocket factory to use SockJS
            connectHeaders: {
                Authorization: `Bearer ${tokenValue}`,
            },
            reconnectDelay: 5000,
            onConnect: () => {
                console.log("Connected to WebSocket");

                // subscribe to private messages for the logged in user
                stompClient.subscribe(`/user/${normalizedUsername}/queue/messages`, (msg) => {
                    const newMsg = JSON.parse(msg.body);
                    console.log("📩 Incoming message:", msg.body);
                    setMessages((prev) => {
                        const exists = prev.some(m => m.id === newMsg.id);
                        return exists ? prev : [...prev, newMsg];
                    });
                });
            },
        });
        /*${username}*/
        /*/${normalizedUsername}*/

        stompClient.activate();
        setClient(stompClient);

        return () => {
            stompClient.deactivate();
        };
    }, [username]);

    // send message in chat
    const sendMessage = () => {
        console.log("user id:", userId);
        if (client && message.trim() && receiverUsername) {
            client.publish({
                destination: "/app/private-message",
                body: JSON.stringify({
                    /*senderId: userId,*/
                    receiverId: receiverUserId,
                    content: message
                }),
            });
            setMessage("");
        }
    };

    // handle key presses in chat so when user is focused on the chat window they can focus the message input field with "Tab" key
    const handleKeyPresses = (event) => {
        const inputMessage = document.getElementById('message-input');

        if (event.key === "Tab" && inputMessage) {

            if (document.activeElement !== inputMessage) {
                inputMessage.focus();
            }
        }

        // handle key presses in chat so when user is focused on the chat window they can send their message with "Enter" key
        const sendButton = document.getElementById('send-message');

        // send message with "Enter" key
        if (event.key === "Enter" && sendButton) {
            sendButton.classList.add("active");

            setTimeout(() => {
                sendButton.classList.remove("active");
            }, 100);

            sendMessage();
        }
    }

    const backToConnections = () => {
        const connections = document.getElementById('connections')
        const chat = document.getElementById('chat')

        if (!chat || !connections) {
            console.log("chat or connections on found");
            return;
        }

        connections.classList.add('show-connections');
        connections.classList.remove('hide-connections');
        chat.classList.remove('show-chat');
        chat.classList.add('hide-chat');
    }

    // format time stamp for chat messages
    const formatTimestamp = (timestamp) => {
        const trimmed = timestamp.slice(0, 23);
        const date = new Date(trimmed);
        const readable = date.toLocaleString();
        return readable;
    }

    // todo add "typing..." indicator when other user is typing
    return (
        <div className="chat-box" onKeyDown={handleKeyPresses}>
            <div className='heading-container'>
                <button className='toggle-connections' onClick={backToConnections} tabIndex={-1}><IoArrowBack /></button>
                <h2>{receiverUsername}</h2>
            </div>
            <div className="chat-messages"
                 ref={scrollRef}
                 onScroll={handleScroll}
            >

                {/*{messages.map((msg, index) => (*/}
                {/*    <div key={index} className={`message-box ${msg.senderUsername === username ? "sent" : "received"}`}>*/}
                {/*        <div className="message-content">{msg.content}</div>*/}
                {/*        <div className="timestamp">{formatTimestamp(msg.timestamp)}</div>*/}
                {/*    </div>*/}
                {/*))}*/}
                {[...messages].reverse().map((msg, index) => (
                    <div key={index} className={`message-box ${msg.senderUsername === username ? "sent" : "received"}`}>
                        <div className="message-content">{msg.content}</div>
                        <div className="timestamp">{formatTimestamp(msg.timestamp)}</div>
                    </div>
                ))}
            </div>
            <div className='input-container'>
                <input
                    id={'message-input'}
                    className="input"
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                />
                <button id={'send-message'} onClick={sendMessage} tabIndex={-1}><IoMdSend /></button>
            </div>
        </div>
    );
};

export default Chat;
