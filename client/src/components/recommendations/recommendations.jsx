import './recommendations.scss';
import '../reusables/profile-card.scss';
import '../reusables/settings-popup.scss';
import '../reusables/loadingAnimation.scss';
import {FaPlay, FaSpotify} from 'react-icons/fa';
import {IoPlaySkipForward} from 'react-icons/io5';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import axios from 'axios';
import {useSwipe} from './useSwipe.jsx';
import {backToObject, formatData, formatLocation, openSettings} from '../reusables/profile-card-functions.jsx';
import {useAuth} from '../utils/AuthContext.jsx';
import {RecommendationsForm} from './recommendations-settings/recommendationsForm.jsx';

// react icons
import {GiSettingsKnobs} from 'react-icons/gi';
import {IoIosArrowBack, IoIosArrowForward} from 'react-icons/io';
import {
	genreOptions,
	goalsOptions,
	matchAgeOptions,
	matchExperienceOptions,
	matchGenderOptions,
	matchLocationsOptions,
	methodsOptions
} from '../reusables/inputOptions.jsx';


function Recommendations() {
	const matchContainerRef = useRef(null);
	const [swipedCount, setSwipedCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadingSettings, setLoadingSettings] = useState(false);
	const [matchIDs, setMatchIDs] = useState(['']);
	const [matches, setMatches] = useState({});
	const [currentMatchNum, setCurrentMatchNum] = useState(0);
	const [currentMatch, setCurrentMatch] = useState(null);
	const [fetchMoreMatches, setFetchMoreMatches] = useState(false);
	const {tokenValue, fetchWithToken} = useAuth();
	const [preferencesData, setPreferencesData] = useState(null);
	const [error, setError] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [buttonDisabled, setButtonDisabled] = useState(false);

	const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
	const {handleTouchStart, handleTouchEnd, handleTouchMove, swipeProgress} = useSwipe();

	function resetMatches() {
		setCurrentMatchNum(0);
		setMatches({}); // Clear existing matches
		setMatchIDs(['']);
		setFetchMoreMatches(prev => !prev);
	}

	// fetch preferences data
	useEffect(() => {
		const getPreferencesData = async () => {

			try {
				const response = await axios.get(`${VITE_BACKEND_URL}/api/me/bio`, {
					headers: {Authorization: `Bearer ${tokenValue}`}
				});

				// formatting data for the recommendations form
				const idealMatchGender = matchGenderOptions.find(gender => gender.value === response.data.payload.idealMatchGender);
				const idealMatchAge = matchAgeOptions.find(age => age.value === response.data.payload.idealMatchAge);
				const idealMatchLocation = matchLocationsOptions.find(location => location.value === response.data.payload.idealMatchLocation);
				const idealMatchYearsOfExperience = matchExperienceOptions.find(exp => exp.value === response.data.payload.idealMatchYearsOfExperience);
				const idealMatchGenres = backToObject(response.data.payload.idealMatchGenres, genreOptions);
				const idealMatchMethods = backToObject(response.data.payload.idealMatchMethods, methodsOptions);
				const idealMatchGoals = backToObject(response.data.payload.idealMatchGoals, goalsOptions);

				setPreferencesData({
					idealMatchGender: idealMatchGender,
					idealMatchAge: idealMatchAge,
					idealMatchLocation: idealMatchLocation,
					idealMatchGenres: idealMatchGenres,
					idealMatchMethods: idealMatchMethods,
					idealMatchYearsOfExperience: idealMatchYearsOfExperience,
					idealMatchGoals: idealMatchGoals,
					maxMatchRadius: response.data.payload.maxMatchRadius
				});

			} catch (error) {
				setError(true);
				setErrorMessage(error.message);
				if (axios.isCancel(error)) {
					console.log('Fetch aborted');
				} else {
					if (error.response) {
						console.error('Backend error:', error.response.data); // Server responded with an error
					} else {
						console.error('Request failed:', error.message); // Network error or request issue
					}
				}
			} finally {
				// setLoading(false);
				setLoadingSettings(false);
			}
		};
		getPreferencesData();

	}, []);

	// fetch IDs of matched users
	useEffect(() => {
		const controller = new AbortController(); // Create an abort controller
		const signal = controller.signal;

		// if (matchIDs.length <= 1) { // no need to fetch matches if already available
		const getAllMatches = async () => {
			try {
				const response = await axios.get(`${VITE_BACKEND_URL}/api/recommendations`, {
					headers: {Authorization: `Bearer ${tokenValue}`},
					signal
				});

				// Access the payload property of the response data
				setMatchIDs(response.data.payload);

				// Check if payload is empty
				if (response.data.payload.length === 0) {
					setLoading(false);
				}
			} catch (error) {
				setError(true);
				setErrorMessage(error.message);
				if (axios.isCancel(error)) {
					console.log('Fetch aborted');
				} else {
					if (error.response) {
						console.error('Backend error:', error.response);
					} else {
						console.error('Request failed:', error.message);
					}
				}
				setLoading(false); // Always set loading to false on error
			}
		};
		getAllMatches();

		return () => controller.abort(); // Cleanup function to abort request
	}, [fetchMoreMatches]);

	// if match ids are fetched from server then fetch the data for all the ids
	useEffect(() => {

		if (matchIDs.length > 0 && matchIDs[0] !== '') {
			const getMatchData = async () => {
				try {
					// Create an array of promises that fetch both profile and user data for each match
					const matchPromises = matchIDs.map(id => {

						// fetch profile pic and name
						const profilePromise = fetchWithToken(`/api/users/${id}/profile`, {}, true);

						// fetch other bio data
						const userPromise = fetchWithToken(`/api/users/${id}`, {}, true);

						// Return both promises for the same id
						return Promise.all([profilePromise, userPromise]).then(([profile, user]) => ({
							...profile.data.payload,   // Merge profile data
							...user.data.payload       // Merge user data
						}));
					});

					// Wait for all promises to resolve
					const matchResults = await Promise.all(matchPromises);

					// Update the matches state with the merged data
					setMatches(matchResults);
					setLoading(false); // disable loading state
				} catch (error) {
					setError(true);
					setErrorMessage(error.message);
					if (error.response) {
						console.error('Backend error:', error.response.data); // Server responded with an error
					} else {
						console.error('Request failed:', error.message); // Network error or request issue
					}
				}
			};
			getMatchData();
		} else if (matchIDs.length === 0 && matchIDs.length !== null){
			setLoading(false);
		}


	}, [matchIDs]);


	// logic when user swipes left or right (likes or dislikes)
	const swipe = (likeOrDislike) => {
		const matchContainer = matchContainerRef.current;
		if (!matchContainer) return;
		let swipedRight = true;

		setButtonDisabled(true);

		setSwipedCount(prev => prev + 1);

		if (likeOrDislike === 'like') {
			swipedRight = true;
			matchContainer.classList.add('like-animation');
		}

		if (likeOrDislike === 'dislike') {
			swipedRight = false;
			matchContainer.classList.add('dislike-animation');
		}

		// send data to backend
		const swipedUser = async () => {
			try {
				// Create a direct JSON object with primitive values
				const requestData = {
					matchId: Number(currentMatch.id), // Ensure it's a number
					swipedRight: swipedRight // Ensure it's a boolean
				};

				const isLastMatch = currentMatchNum === 9;

				if (isLastMatch) {
					setLoading(true);
				}

				await axios.post(
					`${VITE_BACKEND_URL}/api/swiped`,
					requestData,
					{headers: {
							'Authorization': `Bearer ${tokenValue}`,
							'Content-Type': 'application/json'}
					}
				);

				if (isLastMatch) {
					resetMatches();
				}

			} catch (error) {
				console.error('Swipe error full:', error);
				if (error.response) {
					console.error('Swipe error response:', error.response);
					console.error('Swipe error data:', error.response.data);
				}
				setError(true);
				setErrorMessage(error.response?.data?.message || error.message);
			}
		};

		swipedUser();

		setTimeout(() => {
			resetPosition({target: matchContainer});
		}, 600); // Match the CSS transition duration
	};

	// logic to reset the position of matchContainer after like and dislike animation
	const resetPosition = useCallback((event) => {
		const matchContainer = matchContainerRef.current;

		if (!matchContainer || event.target !== matchContainer) return;

		matchContainer.classList.remove('like-animation');
		matchContainer.classList.remove('dislike-animation');

		// Force reflow to apply the changes instantly
		void matchContainer.offsetWidth;
		loadNextMatch();
	}, []);

	// format data
	const formatMatchData = (matchData) => {
		const newMatch = {...matchData};  // Clone to avoid mutations

		for (let key in newMatch) {
			if (key === 'location') {
				newMatch[key] = formatLocation(newMatch[key]);
			} else if (Array.isArray(newMatch[key])) {
				newMatch[key] = formatData([...newMatch[key]]);
			}
		}

		return newMatch;
	};

	const loadNextMatch = (() => {
		setCurrentMatchNum(prevState => prevState + 1);
	});

	// set current match data
	useEffect(() => {
		if (!matches || !matches[currentMatchNum]) {
			setCurrentMatch(null);
			return;
		}
		const formattedMatch = formatMatchData(matches[currentMatchNum]);

		if (formattedMatch?.id) {
			setCurrentMatch(formattedMatch);
		} else {
			setCurrentMatch(null);
		}

	}, [currentMatchNum, matches]);

	// function to toggle button styles
	const toggleDislikeButtons = () => {
		const dislikeButton = document.getElementById('dislike-button');
		dislikeButton.classList.toggle('hidden');

		const likeButton = document.getElementById('like-button');
		likeButton.classList.toggle('flex-end');
		likeButton.classList.toggle('swiping');

		toggleArrows();

	};

	// function to toggle button styles
	const toggleLikeButtons = () => {
		const likeButton = document.getElementById('like-button');
		likeButton.classList.toggle('hidden');

		const dislikeButton = document.getElementById('dislike-button');
		dislikeButton.classList.toggle('swiping');

		toggleArrows();

	};

	// function to toggle button styles
	const toggleArrows = () => {
		const arrows = document.getElementsByClassName('arrow');
		[...arrows].map(arrow => {
			arrow.classList.toggle('hidden');
		});
	};

	useEffect(() => {
		setButtonDisabled(false)
	}, [currentMatch])

	return (
		<>
			<div className='recommendations-container'>
				{!error ? (
					<>
						{/*{!loading && (*/}
						{/*	<div className='user-stats-container'>*/}
						{/*		<div className='user-stats'>{swipedCount} {swipedCount === 1 ? 'swipe' : 'swipes'}</div>*/}
						{/*	</div>*/}
						{/*)}*/}

						{!loading && (
							<div className='settings-popup' id={'settings-popup'}>
								<div className='settings-content'>
									<div className='forms-container'>
										{preferencesData &&
											<RecommendationsForm preferencesData={preferencesData}
																 setPreferencesData={setPreferencesData}
																 setLoading={setLoading} resetMatches={resetMatches}/>
										}

									</div>
								</div>
							</div>
						)}

						{loading ? (
							<div className={'spinner-container'}>
								<div className='spinner endless'>Finding matches...</div>
							</div>
						) : currentMatch ? (
							<>
								<div
									key={currentMatchNum}
									ref={matchContainerRef}
									id={'match-container'}
									className='profile-card-container'>

									<div className='settings-container'>
										<button className='settings-button' onClick={() => {
											setLoadingSettings(true);
											openSettings();
										}}>
											<GiSettingsKnobs/>
										</button>
									</div>

									<div className='picture-bio-container'>
										<div className='picture-container'>
											<div className='extra-picture-container'>
												{currentMatch.profilePicture && !currentMatch.profilePicture.endsWith('null') ? (
													<img src={currentMatch.profilePicture} alt={currentMatch.username}
														 className='profile-picture'/>
												) : (
													<img src='default_profile_picture.png' alt={currentMatch.username}
														 className='profile-picture'/>
												)
												}
												{currentMatch.linkToMusic ? (
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
													<td style={{width: '60%'}}>{currentMatch.location}</td>
													<td style={{width: '4%'}}></td>
													<td style={{width: '36%'}}>
														{currentMatch.yearsOfMusicExperience === 1
															? `${currentMatch.yearsOfMusicExperience} year`
															: `${currentMatch.yearsOfMusicExperience} years`}
													</td>
												</tr>
												<tr>
													<th className='one-column' colSpan={3}>
														Genres
													</th>
												</tr>
												<tr>
													<td colSpan={3}>{currentMatch.preferredMusicGenres}</td>
												</tr>
												<tr>
													<th className='one-column' colSpan={3}>
														Methods
													</th>
												</tr>
												<tr>
													<td colSpan={3}>{currentMatch.preferredMethod}</td>
												</tr>
												<tr>
													<th className='one-column' colSpan={3}>
														Interests
													</th>
												</tr>
												<tr>
													<td colSpan={3}>{currentMatch.additionalInterests}</td>
												</tr>
												<tr>
													<th className='one-column' colSpan={3}>
														Personality
													</th>
												</tr>
												<tr>
													<td colSpan={3}>{currentMatch.personalityTraits}</td>
												</tr>
												<tr>
													<th className='one-column' colSpan={3}>
														Goals
													</th>
												</tr>
												<tr>
													<td colSpan={3}>{currentMatch.goalsWithMusic}</td>
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
													<td style={{width: '48%'}}>{currentMatch.location}</td>
													<td style={{width: '4%'}}></td>
													<td style={{width: '48%'}}>
														{currentMatch.yearsOfMusicExperience === 1
															? `${currentMatch.yearsOfMusicExperience} year`
															: `${currentMatch.yearsOfMusicExperience} years`}
													</td>
												</tr>
												<tr>
													<th style={{width: '48%'}} className='two-column'>Genres</th>
													<td style={{width: '4%'}}></td>
													<th style={{width: '48%'}} className='two-column'>Methods</th>
												</tr>
												<tr>
													<td style={{width: '48%'}}>{currentMatch.preferredMusicGenres}</td>
													<td style={{width: '4%'}}></td>
													<td style={{width: '48%'}}>{currentMatch.preferredMethod}</td>
												</tr>
												<tr>
													<th style={{width: '48%'}} className='two-column'>Interests</th>
													<td style={{width: '4%'}}></td>
													<th style={{width: '48%'}} className='two-column'>Personality</th>
												</tr>
												<tr>
													<td style={{width: '48%'}}>{currentMatch.additionalInterests}</td>
													<td style={{width: '4%'}}></td>
													<td style={{width: '48%'}}>{currentMatch.personalityTraits}</td>
												</tr>
												<tr>
													<th className='' colSpan={3}>Goals</th>
												</tr>
												<tr>
													<td colSpan={3} className={''}>{currentMatch.goalsWithMusic}</td>
												</tr>

												</tbody>
											</table>

										</div>
									</div>
									<div className='description-container'>
										{currentMatch.description}
									</div>
									<div className='name-container'>
										<span className='name'>{currentMatch.username}</span>
										<br/>
										<span>{currentMatch.age}, {currentMatch.gender}</span>
									</div>
								</div>

								{/*	default buttons */}
								<div
									className='match-buttons-container default'>
									<button className='dislike-button' disabled={buttonDisabled} onClick={() => swipe('dislike')}>
										<IoPlaySkipForward style={{color: 'white', width: '70%', height: '70%'}}
														   id={'svg-dislike'}/>
									</button>
									<button className='like-button' disabled={buttonDisabled} onClick={() => swipe('like')}>
										<FaPlay style={{color: 'white', width: '55%', height: '55%'}} id={'svg-like'}/>
									</button>
								</div>


								{/* mobile buttons */}
								<div
									className='match-buttons-container mobile-buttons'>
									<button className='dislike-button' id={'dislike-button'}
											onTouchStart={() => {
												handleTouchStart();
												toggleLikeButtons();
											}}
											onTouchMove={handleTouchMove}
											onTouchEnd={() => {
												handleTouchEnd(() => swipe('dislike'));
												toggleLikeButtons();
											}}
											style={{
												width: swipeProgress === 0
													? '3rem'// Expands only when swipeProgress > 1
													: `calc(4rem + ${(swipeProgress * 120)}px)`, // Default width
												transition: swipeProgress > 0 ? 'all 0.1s ease-out' : 'all 0.2s ease-in',
												height: swipeProgress === 0 ? '3rem' : 'calc(4rem - 2px)'
											}}
									>
										<IoIosArrowForward className={'swipe-right arrow'} id={'swipe-right'}/>
										<IoPlaySkipForward style={{color: 'white', width: '2rem', height: '2rem'}}
														   id={'svg-dislike'}/>
									</button>
									<button className='like-button' id={'like-button'}
											onTouchStart={() => {
												handleTouchStart();
												toggleDislikeButtons();
											}}
											onTouchMove={handleTouchMove}
											onTouchEnd={() => {
												handleTouchEnd(() => swipe('like'));
												toggleDislikeButtons();
											}}
											style={{
												transition: swipeProgress > 0 ? 'all 0.1s ease-out' : 'all 0.2s ease-in',
												width: swipeProgress === 0
													? '3rem'// Expands only when swipeProgress > 1
													: `calc(4rem + ${(swipeProgress * 120)}px)`, // Default width
												height: swipeProgress === 0 ? '3rem' : 'calc(4rem - 2px)'
											}}
									>
										<IoIosArrowBack className={'swipe-left arrow'} id={'swipe-left'}/>
										<FaPlay style={{color: 'white', width: '1.5rem', height: '1.5rem'}}
												id={'svg-like'}/>
									</button>
								</div>
							</>
						) : (
							<div className='no-matches'>
								<p>No more matches available.</p>
								<br/>
								<button className={'change-preferences'} type={'button'} onClick={openSettings}>Change
									preferences
								</button>
							</div>
						)}
					</>
				) : (
					<div className='api-error'>{errorMessage}</div>
				)
				}


			</div>
		</>
	);
}

export default Recommendations;
