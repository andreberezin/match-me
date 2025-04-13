import './features.scss';
import {SiMusicbrainz} from 'react-icons/si';
import {PiMusicNotesPlus} from 'react-icons/pi';
import {IoChatboxEllipsesOutline} from 'react-icons/io5';


function Features() {
	return (
		<>
			<div className='features-container'>

				<h1 className={'blinking-text'}>Features</h1>

				<div className='features-list'>

					<div className='feature default' id={'matches'}>
						<SiMusicbrainz/>
						<p className='text'>
							Our algorithm matches you with other musicians based on your preferences such as age,
							gender, location, years of experience, the types of genres you prefer, the way you prefer to
							make music and what goals you have.
						</p>
					</div>

					<div className='feature reverse' id={'connections'}>
						<PiMusicNotesPlus/>
						<p className='text'>
							Choose which of the suggested matches you'd like to connect with in a tinder-like manner.
							See the list of your current and pending connections. Accept pending connections to make
							more friends or decline them.
						</p>
					</div>


					<div className='feature default' id={'more-soon'}>
						<IoChatboxEllipsesOutline/>
						<p className='text'>
							Chat securely with your connections to share your passion and ideas. Arrange jam sessions
							and get to know your connections.
						</p>
					</div>

					<div className='feature default' id={'empty'}>
					</div>

				</div>
			</div>
		</>

	);
}

export default Features;