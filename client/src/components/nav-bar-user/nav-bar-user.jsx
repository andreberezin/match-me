import './nav-bar-user.scss';
import {NavLink, useNavigate} from 'react-router-dom';
import {useCallback, useEffect, useState} from 'react';
import {useAuth} from '../utils/AuthContext.jsx';

// mobile icons
import {FiLogOut} from 'react-icons/fi';
import {BsChat} from 'react-icons/bs';
import {FaUserFriends} from 'react-icons/fa';
import {PiMusicNotesPlus} from 'react-icons/pi';
import axios from 'axios';


function NavigatorUser() {
	const navigate = useNavigate();
	const [pendingReqNum, setPendingReqNum] = useState('');
	const {tokenValue, imageUrl, username, logout} = useAuth();

	const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

	const handleLogout = async () => {
		console.log('Logout successful');
		logout();
		navigate('/');
	};

	// fetch the amount of pending requests to display for user
	// todo make into socket connection to get live updates
	const getPendingRequests = useCallback(async () => {

		// console.log('Getting pending requests length');

		try {
			const response = await axios.get(`${VITE_BACKEND_URL}/api/pendingRequests`, {
				headers: {
					'Authorization': `Bearer ${tokenValue}`,
					'Content-Type': 'application/json'
				}
			});

			// don't display 0
			if (response.data.payload.length > 0) {
				setPendingReqNum(response.data.payload.length);
			} else {
				setPendingReqNum('');
			}

		} catch (error) {
			if (axios.isCancel(error)) {
				console.log('Fetch aborted');
			} else {
				console.error('Error getting connections: ', (error.message));
				// todo display error to user
			}
		}
	}, [VITE_BACKEND_URL, tokenValue]);

	useEffect(() => {
		getPendingRequests().catch(error => console.error('Unhandled error at getPendingRequests: ', error));
	}, [getPendingRequests]);

	return (
		<>
			<nav className='nav-container-user default'>
				<div className='profile-container'>
					<NavLink to='/dashboard' tabIndex={-1} className={({isActive}) =>
						`profile-link ${isActive ? 'current' : ''}`
					}>
						{imageUrl && !imageUrl.endsWith('null') ? (
							<img src={imageUrl} alt={'profile picture'} className='profile-picture'/>
						) : (
							<img src='default_profile_picture.png' alt={'profile picture'} className='profile-picture'/>
						)
						}


						{username.split(' ')[0]}
					</NavLink>
				</div>
				<div className='links-container'>
					<NavLink to='/connections' tabIndex={-1} data-type-reqnum={pendingReqNum} className={({isActive}) =>
						`connections ${isActive ? 'current' : ''}`
					}>
						CONNECTIONS
					</NavLink>
					<NavLink to='/chats' tabIndex={-1} className={({isActive}) =>
						`chats ${isActive ? 'current' : ''}`
					}>
						CHATS
					</NavLink>
					<NavLink to='/recommendations' tabIndex={-1} className={({isActive}) =>
						`recommendations ${isActive ? 'current' : ''}`
					}>
						RECOMMENDATIONS
					</NavLink>
				</div>
				<div className='nav-buttons-container'>
					<button className='button logout' title='Log out' tabIndex={-1} onClick={handleLogout}>
						Log out
					</button>
				</div>
			</nav>

			{/* todo*/}
			<nav className='nav-container-user mobile'>

				<div className='links-container'>
					<NavLink to='/connections' data-type-reqnum={pendingReqNum} className={({isActive}) =>
						`icon connections ${isActive ? 'current' : ''}`
					}>
						<FaUserFriends/>
					</NavLink>
					<NavLink to='/chats' className={({isActive}) =>
						`icon chats ${isActive ? 'current' : ''}`
					}>
						<BsChat/>
					</NavLink>
					<div className='profile-container'>
						<NavLink to='/dashboard' className={({isActive}) =>
							`profile-link ${isActive ? 'current' : ''}`
						}>
							{!imageUrl.endsWith('null') && (
								<img src={imageUrl} alt='Profile' className='profile-picture'/>
							)}
							{imageUrl.endsWith('null') && (
								<img
									src='default_profile_picture.png'
									alt='profile picture'
									className='profile-picture'
								/>
							)}
						</NavLink>
					</div>
					<NavLink to='/recommendations' className={({isActive}) =>
						`icon recommendations ${isActive ? 'current' : ''}`
					}>
						<PiMusicNotesPlus/>
					</NavLink>
					<button className='logout' title='Log out' onClick={handleLogout}>
						<FiLogOut/>
					</button>
				</div>
			</nav>
		</>

	);
}

export default NavigatorUser;

