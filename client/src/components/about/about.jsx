import './about.scss';

function About() {


	const container = document.querySelector('.about-container');
	if (container) {
		console.log("container");
		container.scrollTop = 0;
	}

	return (
		<>

			<h1 className={'blinking-text'}>Jammer</h1>

			<div className='about-container'>

				<img className={'background-image one'} src={'icon_black.png'} alt={''}/>
				<img className={'background-image two'} src={'icon_black.png'} alt={''}/>

				<div className='about-text'>
					<p className={'left'}>
						At Jammer, we believe that music is a universal language that connects people from all corners
						of the world. Whether you’re a seasoned musician or just starting your musical journey, Jammer
						is here to help you find like-minded individuals to collaborate with, create, and jam together.
					</p>
					<p className={'right'}>
						Our platform brings musicians from diverse backgrounds and genres together in one space, making
						it
						easier than ever to connect with potential bandmates, find jam sessions, and share your passion
						for
						music. No matter where you are, Jammer is your global stage for musical discovery.
					</p>
					<p className={'mid'}>
						Join the Jammer community today, and let the music play!
					</p>
					<div className={'empty'}></div>
				</div>
			</div>
		</>

	);
}

export default About;
