import './connections.scss';
import '../reusables/profile-card.scss';
import {useCallback, useEffect, useRef, useState} from 'react';
import axios from 'axios';
import {useAuth} from '../utils/AuthContext.jsx';
import {closeSettings, formatData, formatLocation, openSettings} from '../reusables/profile-card-functions.jsx';

import {FaRegCirclePlay, FaRegCircleXmark} from 'react-icons/fa6';
import {IoClose} from 'react-icons/io5';
import {FaSpotify} from 'react-icons/fa';


function Connections() {
	const [loading, setLoading] = useState(true);
	// eslint-disable-next-line no-unused-vars
	const [currentConnectionIds, setCurrentConnectionIds] = useState([]);
	const [currentConnections, setCurrentConnections] = useState([]);
	// eslint-disable-next-line no-unused-vars
	const [pendingConnectionIds, setPendingConnectionIds] = useState([]);
	const [pendingConnections, setPendingConnections] = useState([]);
	const [isDeleting, setIsDeleting] = useState(false);
	const [pendingOrCurrent, setPendingOrCurrent] = useState('current');
	const [currentDataFetched, setCurrentDataFetched] = useState(false);
	const [pendingDataFetched, setPendingDataFetched] = useState(false);
	const toDeleteId = useRef(0);
	const [error, setError] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [toDeleteName, setToDeleteName] = useState('');
	const {tokenValue, fetchWithToken } = useAuth();
	const [toDisplay, setToDisplay] = useState(null);
	const isDataFormatted = useRef(false);


	const modal = document.getElementById('loadingModal');
	const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;


	// toggle pending and current button styles
	const toggleButton = useCallback((event) => {
		// add .active class to the button and remove .active class from the other button
		const buttons = document.querySelectorAll('.current-pending-buttons-container button');
		buttons.forEach(button => {
			if (button === event.target) {
				button.classList.add('active');
			} else {
				button.classList.remove('active');
			}
		});
	}, []);

	// fetch data based on ids
	const getConnectionsData = useCallback(async (ids, setState, setFetchedState) => {

		if (isDeleting === false) {
			try {
				const connections = ids.map(id => {
					const profilePromise = fetchWithToken(`/api/users/${id}/profile`, {}, true); // true = use service token
					const userPromise = fetchWithToken(`/api/users/${id}`, {}, true); // true = use service token

					// fetch profile pic and name
					/*const profilePromise = axios.get(`${VITE_BACKEND_URL}/api/users/${id}/profile`, {
						headers: {
							'Authorization': `Bearer ${tokenValue}`,
							'Content-Type': 'application/json',
							signal
						}
					});

					// fetch other bio data
					const userPromise = axios.get(`${VITE_BACKEND_URL}/api/users/${id}`, {
						headers: {
							'Authorization': `Bearer ${tokenValue}`,
							'Content-Type': 'application/json',
							signal
						}
					});*/

					// Return both promises for the same id
					return Promise.all([profilePromise, userPromise]).then(([profile, user]) => ({
						...formatDataForView(profile.data.payload),   // Merge profile data
						...user.data.payload // Merge user data
					}));
				});

				// Wait for all promises to resolve
				const responses = await Promise.all(connections);

				setState(responses);
				setFetchedState(true); // Indicate that data has been fetched

			} catch (error) {
				setError(true);
				setErrorMessage(error.message);
				if (axios.isCancel(error)) {
					console.log('Fetch aborted');
				} else {
					if (error.response) {
						console.error('Backend error:', error.response); // Server responded with an error
					} else {
						console.error('Request failed:', error.message); // Network error or request issue
					}
					// todo display error to user
				}
			}
		}
	}, [fetchWithToken, isDeleting]);


	// fetch connection ids
	const getConnectionIds = useCallback(async () => {
		const controller = new AbortController(); // Create an abort controller
		const signal = controller.signal;

		try {
			const [currentConnectionsResponse, pendingConnectionsResponse] = await Promise.all([
				fetchWithToken(`/api/connections`, {
					/*headers: {
						'Authorization': `Bearer ${tokenValue}`,
						'Content-Type': 'application/json'
					}*/
					signal
				}, false),
				fetchWithToken(`/api/pendingRequests`, {
					signal
				}, false)
			]);

			const currentIds = currentConnectionsResponse.data.payload || [];
			const pendingIds = pendingConnectionsResponse.data.payload || [];

			await getConnectionsData(currentIds, setCurrentConnections, setCurrentDataFetched);
			await getConnectionsData(pendingIds, setPendingConnections, setPendingDataFetched);

		} catch (error) {
			setError(true);
			setErrorMessage(error.message);
			if (axios.isCancel(error)) {
				console.log('Fetch aborted');
			} else {
				console.error('Error getting connections: ', (error.message));
				// todo display error to user
			}
		}
	}, [fetchWithToken, getConnectionsData]);

	// format received data
	const formatDataForView = (data) => {
		if (data !== null && data && isDataFormatted.current === false) {
			return {
				...data,
				location: formatLocation(data.location),
				// location: myDataFormatted.location,
				preferredMusicGenres: Array.isArray(data.preferredMusicGenres)
					? formatData(data.preferredMusicGenres)
					: data.preferredMusicGenres,
				preferredMethod: Array.isArray(data.preferredMethod)
					? formatData(data.preferredMethod)
					: data.preferredMethod,
				additionalInterests: Array.isArray(data.additionalInterests)
					? formatData(data.additionalInterests)
					: data.additionalInterests,
				personalityTraits: Array.isArray(data.personalityTraits)
					? formatData(data.personalityTraits)
					: data.personalityTraits,
				goalsWithMusic: Array.isArray(data.goalsWithMusic)
					? formatData(data.goalsWithMusic)
					: data.goalsWithMusic
			};
		}
		return data;
	};

	// display connections
	const displayConnections = (connections) => {
		if (connections.length === 0) {

			if (connections === currentConnections && pendingOrCurrent === 'current') {
				return (
					<div className='no-connections-message'>No connections yet</div>
				);
			}

			if (connections === pendingConnections && pendingOrCurrent === 'pending') {
				return (
					<div className='no-connections-message'>No requests yet</div>
				);
			}

		}

		return connections.map((connection, index) => (
			<div key={index} id={connection.id} className='connection'>

				<button className='profile-button' onClick={async (event) => {
					openSettings();
					const parentId = getIdOfParent(event);
					await displayProfile(parentId);
				}}>
					<div className='picture-name-container'>
						{connection.profilePicture && !connection.profilePicture.endsWith('null') ? (
							<img src={connection.profilePicture} alt={connection.username} className='connection-pic'/>
						) : (
							<img src='default_profile_picture.png' alt={connection.username}
								 className='connection-pic'/>
						)
						}
						<div className='name'>{connection.username}</div>
					</div>
				</button>

				{connections === currentConnections && (
					<div className='connections-buttons-container'>
						{/*<button className='chat'><BsChat /></button>*/}
						<button className='delete' onClick={() => {
							deleteConnection(connection.id, connection.username);
						}}
						>
							<FaRegCircleXmark/></button>
					</div>
				)}

				{connections === pendingConnections && (
					<div className='connections-buttons-container'>
						<button className='accept' onClick={() => acceptRequest(connection.id)}><FaRegCirclePlay/>
						</button>
						<button className='delete' onClick={() => deleteConnection(connection.id, connection.username)}>
							<FaRegCircleXmark/></button>
					</div>
				)}

			</div>
		));
	};

	// fetch current and pending connection ids
	useEffect(() => {
		getConnectionIds().catch(error => console.error('Unhandled error at getConnectionIds: ', error));
	}, [getConnectionIds]);

	// change loading state when all data is fetched
	useEffect(() => {
		if (currentDataFetched && pendingDataFetched) {
			setLoading(false);
		}
	}, [currentDataFetched, pendingDataFetched]);

	// delete connection
	const deleteConnection = (connectionId, connectionName) => { // connectionId, setConnections, setConnectionsIds
		// setIsDeleting(true);

		toDeleteId.current = connectionId;
		setToDeleteName(connectionName); // Use useState to trigger a re-render
		modal.style.display = 'flex'; // Show modal
	};

	// Handle the accept button click
	const acceptDelete = async(setState, setIdState) => {
		setIsDeleting(true);

		let endpoint = '';
		let paramKey = '';

		if (setState === setPendingConnections) {
			endpoint = 'deletePendingRequest';
			paramKey = 'pendingRequestId';
		}

		if (setState === setCurrentConnections) {
			endpoint = 'deleteConnection';
			paramKey = 'connectionId';
		}

		if (!endpoint || !paramKey) {
			console.error('Invalid state setter function provided.');
			setIsDeleting(false);
			return;
		}

		try {
			setState((prevConnections) => prevConnections.filter((connection) => connection.id !== toDeleteId.current));
			setIdState((prevIds) => prevIds.filter((id) => id !== toDeleteId.current));
			//Remove the connection from the state
			await axios.delete(`${VITE_BACKEND_URL}/api/${endpoint}`, {
				headers: {
					'Authorization': `Bearer ${tokenValue}`,
					'Content-Type': 'application/json'
				},
				params: {[paramKey]: toDeleteId.current} // Include request parameters here
			});
		} catch (error) {
			setError(true);
			setErrorMessage(error.message);
			if (error.response) {
				console.error('Backend error:', error.response); // Server responded with an error
			} else {
				console.error('Request failed:', error.message); // Network error or request issue
			}
		} finally {
			setIsDeleting(false);
			modal.style.display = 'none'; // Close the modal
		}
	};

	const cancelDelete = () => {
		modal.style.display = 'none'; // Close the modal without navigating
	};

	// accept pending request
	const acceptRequest = async(requestId) => {

		// add to connections
		try {
			await axios.post(`${VITE_BACKEND_URL}/api/addConnection`, {
				matchId: requestId
			}, {
				headers: {
					'Authorization': `Bearer ${tokenValue}`,
					'Content-Type': 'application/json'
				},
			});

		} catch (error) {
			setError(true);
			setErrorMessage(error.message);
			if (error.response) {
				console.error('Backend error:', error.response); // Server responded with an error
			} else {
				console.error('Request failed:', error.message); // Network error or request issue
			}
		}

		// delete the pending request
		setIsDeleting(true);

		try {
			await axios.delete(`${VITE_BACKEND_URL}/api/deletePendingRequest`, {
				headers: {
					'Authorization': `Bearer ${tokenValue}`,
					'Content-Type': 'application/json'
				},
				params: {pendingRequestId: requestId} // Include request parameters here
			});
			setPendingConnections((prevConnections) => prevConnections.filter((connection) => connection.id !== requestId));
			setPendingConnectionIds((prevIds) => prevIds.filter((id) => id !== requestId));

		} catch (error) {
			setError(true);
			setErrorMessage(error.message);
			if (error.response) {
				console.error('Backend error:', error.response); // Server responded with an error
			} else {
				console.error('Request failed:', error.message); // Network error or request issue
			}
		} finally {
			setIsDeleting(false);
		}
	};

	// get id of parent element
	const getIdOfParent = (event) => {
		return Number(event.currentTarget.parentNode.id);
	};


	// display profile of connection
	const displayProfile = (id) => {
		let userToDisplay;

		// find the correct user either from current or pending list
		if (pendingOrCurrent === 'current') {
			userToDisplay = currentConnections.find((connection) => connection.id === id);
		} else if (pendingOrCurrent === 'pending') {
			userToDisplay = pendingConnections.find((connection) => connection.id === id);
		}


		if (userToDisplay) {
			setToDisplay(
				<div
					// key={userToDisplayNum}
					// ref={matchContainerRef}
					// id={'match-container'}
					className='profile-card-container'>

					<div className='picture-bio-container'>
						<div className='picture-container'>
							<div className='extra-picture-container'>
								{userToDisplay.profilePicture && !userToDisplay.profilePicture.endsWith('null') ? (
									<img src={userToDisplay.profilePicture} alt={userToDisplay.username}
										 className='profile-picture'/>
								) : (
									<img src='default_profile_picture.png' alt={userToDisplay.username}
										 className='profile-picture'/>
								)
								}
								{userToDisplay.linkToMusic ? (
									<div className='music-link'>
										<FaSpotify style={{color: '#31D165'}}/>
									</div>
								) : ('')
								}

							</div>
						</div>

						{/* bigger screen design*/}
						<div className='bio-container default'>

							<table className='bio-table'>
								<tbody>
								<tr>
									<th style={{width: '60%'}} className='two-column'>
										Location
									</th>
									<td style={{width: '4%'}}></td>
									<th style={{width: '36%'}} className='two-column'>
										Experience
									</th>
								</tr>
								<tr>
									<td style={{width: '60%'}}>{userToDisplay.location}</td>
									<td style={{width: '4%'}}></td>
									<td style={{width: '36%'}}>
										{userToDisplay.yearsOfMusicExperience === 1
											? `${userToDisplay.yearsOfMusicExperience} year`
											: `${userToDisplay.yearsOfMusicExperience} years`}
									</td>
								</tr>
								<tr>
									<th className='one-column' colSpan={3}>
										Genres
									</th>
								</tr>
								<tr>
									<td colSpan={3}>{userToDisplay.preferredMusicGenres}</td>
								</tr>
								<tr>
									<th className='one-column' colSpan={3}>
										Methods
									</th>
								</tr>
								<tr>
									<td colSpan={3}>{userToDisplay.preferredMethod}</td>
								</tr>
								<tr>
									<th className='one-column' colSpan={3}>
										Interests
									</th>
								</tr>
								<tr>
									<td colSpan={3}>{userToDisplay.additionalInterests}</td>
								</tr>
								<tr>
									<th className='one-column' colSpan={3}>
										Personality
									</th>
								</tr>
								<tr>
									<td colSpan={3}>{userToDisplay.personalityTraits}</td>
								</tr>
								<tr>
									<th className='one-column' colSpan={3}>
										Goals
									</th>
								</tr>
								<tr>
									<td colSpan={3}>{userToDisplay.goalsWithMusic}</td>
								</tr>
								</tbody>
							</table>
						</div>

						{/*	 mobile design */}

						<div className='bio-container mobile'>
							<table className='bio-table'>
								<tbody>
								<tr>
									<th style={{width: '48%'}} className='two-column'>Location</th>
									<td style={{width: '4%'}}></td>
									<th style={{width: '48%'}} className='two-column'>Experience</th>
								</tr>
								<tr>
									<td style={{width: '48%'}}>{userToDisplay.location}</td>
									<td style={{width: '4%'}}></td>
									<td style={{width: '48%'}}>
										{userToDisplay.yearsOfMusicExperience === 1
											? `${userToDisplay.yearsOfMusicExperience} year`
											: `${userToDisplay.yearsOfMusicExperience} years`}
									</td>
								</tr>
								<tr>
									<th style={{width: '48%'}} className='two-column'>Genres</th>
									<td style={{width: '4%'}}></td>
									<th style={{width: '48%'}} className='two-column'>Methods</th>
								</tr>
								<tr>
									<td style={{width: '48%'}}>{userToDisplay.preferredMusicGenres}</td>
									<td style={{width: '4%'}}></td>
									<td style={{width: '48%'}}>{userToDisplay.preferredMethod}</td>
								</tr>
								<tr>
									<th style={{width: '48%'}} className='two-column'>Interests</th>
									<td style={{width: '4%'}}></td>
									<th style={{width: '48%'}} className='two-column'>Personality</th>
								</tr>
								<tr>
									<td style={{width: '48%'}}>{userToDisplay.additionalInterests}</td>
									<td style={{width: '4%'}}></td>
									<td style={{width: '48%'}}>{userToDisplay.personalityTraits}</td>
								</tr>
								<tr>
									<th className='' colSpan={3}>Goals</th>
								</tr>
								<tr>
									<td colSpan={3} className={''}>{userToDisplay.goalsWithMusic}</td>
								</tr>

								</tbody>
							</table>

						</div>
					</div>
					<div className='description-container'>
						{userToDisplay.description}
					</div>
					<div className='name-container'>
						<span className='name'>{userToDisplay.username}</span>
						<br/>
						<span>{userToDisplay.age}, {userToDisplay.gender}</span>
					</div>
				</div>
			);
		}
	};


	return (
		<div className='connections-container'>

			<div className='settings-popup' id='settings-popup'>
				<div className='settings-content'>
					<button className='close-settings' type={'button'} onClick={() => {
						closeSettings();
						setToDisplay(null);
					}}><IoClose/></button>
					{toDisplay}
				</div>
			</div>


			{!error ? (
				<>
					<div id='loadingModal' className='modal'>
						<div className='modal-content'>
							<p className='modal-text'>You are about to remove <br/> {toDeleteName}</p>
							<p style={{marginTop: '0.5rem'}}>Are you sure?</p>
							<div className='modal-buttons'>
								{pendingOrCurrent === 'current' ? (
									<button id='acceptButton' onClick={() => {
										acceptDelete(setCurrentConnections, setCurrentConnectionIds).catch(error => console.error('Unhandled error at acceptDelete: ', error));
									}}>
										<span>Yes</span>
									</button>
								) : (
									<button id='acceptButton' onClick={() => {
										acceptDelete(setPendingConnections, setPendingConnectionIds).catch(error => console.error('Unhandled error at acceptDelete: ', error));
									}}>
										<span>Yes</span>
									</button>
								)
								}

								<button id='cancelButton' onClick={() => {
									cancelDelete();
								}}>
									<span>No</span>
								</button>
							</div>
						</div>
					</div>

					{loading && (
						<div className={'spinner-container'}>
							<div className='spinner endless'>Finding friends...</div>
						</div>
					)}

					{!loading && (
						<div className='extra-connections-container'>

							<div className='current-pending-buttons-container'>

								<button className='current active' onClick={(event) => {
									toggleButton(event);
									setPendingOrCurrent('current');
								}}>Current connections
								</button>

								<button className='pending' onClick={(event) => {
									toggleButton(event);
									setPendingOrCurrent('pending');
								}}>Pending connections
								</button>
							</div>


							<div className='connections-list'>

								{pendingOrCurrent === 'current' && displayConnections(currentConnections)}

								{pendingOrCurrent === 'pending' && displayConnections(pendingConnections)}

							</div>

							<div className='user-stats-container'>
								{(pendingOrCurrent === 'current' && currentConnections.length > 0) ||
								(pendingOrCurrent !== 'current' && pendingConnections.length > 0) ? (
									<div className='user-stats'>
										You have {pendingOrCurrent === 'current'
										? `${currentConnections.length} ${currentConnections.length === 1 ? 'connection' : 'connections'}`
										: `${pendingConnections.length} ${pendingConnections.length === 1 ? 'request' : 'requests'}`
									}
									</div>
								) : null}
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

export default Connections;

