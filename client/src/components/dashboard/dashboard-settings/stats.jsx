import './stats.scss'
import {closeSettings} from '../../reusables/profile-card-functions.jsx';
import {IoClose} from 'react-icons/io5';

// stats page of /dashboard settings
export function Stats () {

	return (
		<>
			<button className='close-settings' type={'button'} onClick={() => {closeSettings();}}><IoClose /></button>
			<div className={'stats'}>Stats coming soon!</div>
		</>

	)
}