/// <reference path="../socket.io.min.js" />
const socket = io();
const STATES = {
	JOIN: 0,
	CREATE: 1,
	PLAY: 2,
	OVER: 3,
};

const IS_RIGHT_PATH = {
	JOIN: (path) => path === '/join',
	CREATE: (path) => path === '/create',
	PLAY: (path) => Boolean(path.match(/^\/game\/[A-Za-z0-9\-_]{6}$/)),
	OVER: (path) => Boolean(path.match(/^\/game\/[A-Za-z0-9\-_]{6}$/)),
};

const SHAPES = [
	{
		path: '/public/images/avatar/triangle.gif',
	},
	{
		path: '/public/images/avatar/square.gif',
	},
	{
		path: '/public/images/avatar/circle.gif',
	},
];

const AVATAR_COLORS = [
	{
		color: '#f54d33',
		filter: 'invert(51%) sepia(61%) saturate(5211%) hue-rotate(339deg) brightness(96%) contrast(101%)',
	},
	{
		color: '#fa972d',
		filter: 'invert(69%) sepia(61%) saturate(1899%) hue-rotate(16deg) brightness(127%) contrast(97%)',
	},
	{
		color: '#94fa2d',
		filter: 'invert(80%) sepia(40%) saturate(759%) hue-rotate(37deg) brightness(355%) contrast(110%)',
	},
	{
		color: '#1ceb1c',
		filter: 'invert(56%) sepia(75%) saturate(1085%) hue-rotate(74deg) brightness(108%) contrast(102%)',
	},
	{
		color: '#1cebe4',
		filter: 'invert(81%) sepia(40%) saturate(920%) hue-rotate(130deg) brightness(350%) contrast(93%)',
	},
	{
		color: '#2189eb',
		filter: 'invert(52%) sepia(41%) saturate(6406%) hue-rotate(191deg) brightness(97%) contrast(90%)',
	},
	{
		color: '#9321eb',
		filter: 'invert(42%) sepia(100%) saturate(7199%) hue-rotate(268deg) brightness(87%) contrast(99%)',
	},
	{
		color: '#f728f0',
		filter: 'invert(38%) sepia(69%) saturate(5761%) hue-rotate(283deg) brightness(100%) contrast(111%)',
	},
	{
		color: '#e31e59',
		filter: 'invert(35%) sepia(74%) saturate(7401%) hue-rotate(330deg) brightness(91%) contrast(95%)',
	},
];

let state = STATES.JOIN;

const CARD_EFFECTS = {
	NOTHING: {
		number: 0,
		className: '',
		image: '/public/images/close.png',
		name: null,
	},
	KING: {
		number: 1,
		className: 'card-effect-king',
		image: '/public/images/crown.png',
		name: 'Crown',
	},
	CONFETTI: {
		number: 2,
		className: 'card-effect-confetti',
		image: '/public/images/confetti.png',
		name: 'Confetti',
	},
	ARROW: {
		number: 3,
		className: 'card-effect-arrow',
		image: '/public/images/downArrow.png',
		name: 'Arrow',
	},
};

const TUTORIAL_PAGES = [
	{
		image: '/public/images/tutorial/what-you-see.png',
		title: 'The Great Four',
		content: "These are the four cards that the game is based around.\n Each round a lier and a random card are chosen. \
		The lier's job is to make sure no one manages to guess the secret card. ",
	},
	{
		image: '/public/images/tutorial/what-the-lier-sees.png',
		title: 'The Great Four',
		content: "Being the lier gives you the ability to see the secret card. \n Don't let anyone else know it!",
	},
	{
		image: '/public/images/tutorial/timer.png',
		title: 'The Timer',
		content: 'The timer shows the time left until the end of the round. ',
	},
	{
		image: '/public/images/tutorial/gamecode.png',
		title: 'The Gamecode',
		content: 'The code of the room. Click it to share it with some friends, so they can play too!',
	},
	{
		image: '/public/images/tutorial/scoreboard.png',
		title: 'The Scoreboard',
		content: 'The scoreboard shows the players who are playing with you, as well as some additional information about them, \
		such as their guess, whether or not they are the lier, their score and more.\n \
		Notice that your score is highlighted with a darker background.',
	},
	{
		image: '/public/images/tutorial/chat.png',
		title: "Chattin'",
		content: 'Feel free to chat with your buddies! Also, manipulation is cool here so have fun or something',
	},
	{
		image: '/public/images/tutorial/clicked-card.png',
		title: 'Pick A Card!',
		content: 'Guessers can vote on a specific card, just click on it!',
	},
	{
		image: '/public/images/tutorial/effect.png',
		title: 'Shnooking?',
		content: "Are you the lier? Well, that means you can't vote. But what can you do?\n \
		You can always apply a cool effect on a card of your choice!",
	},
	{
		image: '/public/images/tutorial/challenge.png',
		title: 'Free Points???',
		content: 'Liers can also gain points by completing challenges! Do as the hint says, keep your secret, and enjoy the free points!',
	},
	{
		image: '/public/images/tutorial/specials.png',
		title: 'Need Some Boosting?',
		content: 'The specials are another cool feature. Sometimes, certain players can use some abilities to get an advantage (removing other votes, doubling the points gained, etc.)',
	},
];

const SPECIALS = {
	doubling: {
		challengeDivClassName: 'challenge-doubling',
		themeDivClassName: 'main-theme-doubles',
		content: 'Doubles',
		help: 'Doubling is a game mechanic that allows guessers to double the points gained, as well as the points lost every round. ',
		setChallengeDiv: (isGuessing) => {
			if (isGuessing) {
				acceptableChallengeDiv.style.display = 'flex';
				acceptableChallengeDiv.children[0].innerText = 'Double the risk, double the reward!';
			}
		},
		func: (username) => {
			const playerElement = document.querySelector(`[data-username='${username}']`);
			playerElement.classList.add('player-doubling');
		},
	},
	earthquake: {
		challengeDivClassName: 'challenge-earthquake',
		themeDivClassName: 'main-theme-earthquake',
		content: 'Earthquakes',
		help: "Earthquakes can be used by liers to remove other player's guesses. This special is disabled a few moments before the end of the round.",
		setChallengeDiv: (isGuessing) => {
			if (!isGuessing) {
				acceptableChallengeDiv.style.display = 'flex';
				acceptableChallengeDiv.children[0].innerText = 'TAKE OUT THEIR VOTES!';
			}
		},
		func: (username) => {
			cards.forEach((card) => {
				card.animate(
					[
						{
							transform: 'none',
						},
						{
							transform: `translateY(${Math.floor(Math.random() * 16)}px) rotate(4deg)`,
						},
						{
							transform: `translateY(-${Math.floor(Math.random() * 16)}px)`,
						},
						{
							transform: `translateY(${Math.floor(Math.random() * 16)}px) rotate(-4deg)`,
						},
						{
							transform: `translateY(-${Math.floor(Math.random() * 16)}px)`,
						},
					],
					{
						duration: 150,
						iterations: 4,
					}
				);
				card.classList.add('card-earthquake');
			});
			setTimeout(() => {
				cards.forEach((card) => {
					card.classList.remove('card-earthquake');
				});
			}, 700);
		},
	},
	fifty: {
		challengeDivClassName: 'challenge-fifty',
		themeDivClassName: 'main-theme-fifty',
		content: "50/50's",
		help: 'By using the 50/50 special, your vote will change automatically to another random card. You have a 50% chance of getting the right one.',
		setChallengeDiv: (isGuessing) => {
			if (isGuessing) {
				acceptableChallengeDiv.style.display = 'flex';
				acceptableChallengeDiv.children[0].innerText = '50% chance to get the right card!';
			}
		},
		func: (username) => {
			const playerElement = document.querySelector(`[data-username='${username}']`);
			playerElement.classList.add('player-fiftying');
		},
	},
};

let player = null;
let isAdmin = false;
let isGuessing = false;
let roomData = null;
let timer = null;
let winner = null;
let newMessagesCounter = 0;
let currentJoinOrCreateShapeIndex = 0;
let currentJoinOrCreateColorIndex = 0;
let doubledPlayerUsernames = new Set();
let currentSpecial = null;
let currentTutorialPage = 0;

const mainDiv = document.querySelector('.main');
const roomInfoDiv = document.querySelector('.room-info');
const roomIdTitle = document.querySelector('#room-id-title');
const roomPlayers = document.querySelector('#room-players');
const roomRounds = document.querySelector('#room-rounds');
const joinOrCreateDiv = document.querySelector('.join-or-create-options');
const joinForm = document.querySelector('.join-form');
const createForm = document.querySelector('.create-form');
const joinOrCreateSwapStateButton = document.querySelector('.join-or-create-swap');

const createButton = document.querySelector('.create-form button');
const timePerRoundInput = document.querySelector('.timePerRoundInput');
const numberOfRoundsInput = document.querySelector('.numberOfRoundsInput');
const maxPlayersInput = document.querySelector('.maxPlayersInput');

const joinButton = document.querySelector('.join-form button');
const joinRoomInput = document.querySelector('#room-id-input');
const usernameInput = document.querySelector('#username-input');
const joinFailSpan = document.querySelector('.join-or-create-fail');

const leftShapeArrow = document.querySelector('#left-shape-arrow');
const rightShapeArrow = document.querySelector('#right-shape-arrow');
const avatarImage = document.querySelector('.avatar-image');
const leftColorArrow = document.querySelector('#left-color-arrow');
const rightColorArrow = document.querySelector('#right-color-arrow');
const avatarColor = document.querySelector('.avatar-color');

const chatInput = document.querySelector('#chat-input');
const chatButton = document.querySelector('#chat-button');
const chatContent = document.querySelector('.chat-content');
const goToChatButton = document.querySelector('.go-to-chat-btn');

const playersDiv = document.querySelector('.main-players');
const themeDiv = document.querySelector('.main-theme');

const ownerStartButton = document.querySelector('#room-owner-start');
const timerSpan = document.querySelector('#room-timer');
const gameModeSpan = document.querySelector('#game-mode-span');

const challengeDiv = document.querySelector('.challenge-div');
const acceptableChallengeDiv = document.querySelector('.challenge-acceptable');
const acceptableChallengeDivAccept = document.querySelector('.challenge-acceptable .btn-accept');
const acceptableChallengeDivReject = document.querySelector('.challenge-acceptable .btn-reject');

const cards = document.querySelectorAll('.card');
const mainCards = document.querySelector('.main-cards');

const hideAllDiv = document.querySelector('.hide-all');

const tutorialDiv = document.querySelector('.tutorial-div');
const helpBtn = document.querySelector('.btn-help');

function cardIndexToLetter(index) {
	return String.fromCharCode('A'.charCodeAt(0) + index);
}

function sceneTransition(func, text, duration) {
	hideAllDiv.style.display = 'block';
	hideAllDiv.innerText = text;
	hideAllDiv.animate(
		[
			{
				opacity: 1,
				offset: 0.1,
			},
			{
				opacity: 0.8,
				transform: 'translateY(0%)',
			},
			{
				transform: 'translateY(100%)',
				opacity: 0.8,
			},
		],
		{
			duration,
			iterations: 1,
		}
	);

	// Start animation, call func mid-animation, wait untill animation is over and hide the div
	func();
	setTimeout(() => {
		hideAllDiv.style.display = 'none';
	}, duration);
}

cards.forEach((card, i) => {
	card.addEventListener('click', () => {
		if (roomData && player && roomData.hasStarted) {
			if (isGuessing) {
				socket.emit('guess', i);
				player.guess = i;
				cards.forEach((c) => c.classList.remove('card-locked'));
				card.classList.add('card-locked');
			}
		}
	});

	new Array(...card.children[1].children).forEach((cardButton, buttonIndex) => {
		cardButton.style.backgroundImage = `url(${Object.values(CARD_EFFECTS)[buttonIndex].image})`;
		cardButton.style.display = 'none';
		cardButton.addEventListener('click', () => {
			if (roomData && player && roomData.hasStarted && !isGuessing) {
				socket.emit('effect', { effectType: buttonIndex, cardIndex: i });
			}
		});
	});

	card.children[2].children[0].style.backgroundSize = 'auto 0%';
});

goToChatButton.addEventListener('click', () => {
	setNewMessagesCounter(0);
	chatButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

acceptableChallengeDivAccept.addEventListener('click', () => {
	// Emit the name of the only special that is currently enabled
	socket.emit('accepted_special', currentSpecial);
	acceptableChallengeDiv.classList.add('challenge-div-complete');
});

acceptableChallengeDivReject.addEventListener('click', () => {
	acceptableChallengeDiv.classList.add('challenge-div-complete');
});

function setNewMessagesCounter(count) {
	newMessagesCounter = count;
	if (count === 0) {
		goToChatButton.children[0].style.display = 'none';
	} else {
		goToChatButton.children[0].style.display = 'inline';
		goToChatButton.children[0].innerText = count;
	}
}

function showMessage(p, c, system = false) {
	const viewMessage = document.createElement('p');
	const messageUser = document.createElement('span');
	const messageContent = document.createElement('span');
	messageUser.style.color = 'blue';
	viewMessage.appendChild(messageUser);
	viewMessage.appendChild(messageContent);

	messageUser.innerText = `[${p}]: `;

	if (p === player.username) {
		messageUser.innerText = `[${p} (you)]: `;
		if (roomData.roundsPlayed < roomData.maxRounds && roomData.hasStarted && p === roomData.players[roomData.lier].username) {
			messageUser.innerText = `[${p} (you, lier)]: `;
			messageUser.style.color = 'purple';
		}
	} else if (roomData.roundsPlayed < roomData.maxRounds && roomData.hasStarted && p === roomData.players[roomData.lier].username) {
		messageUser.innerText = `[${p} (lier)]: `;
		messageUser.style.color = 'purple';
	}

	if (system) {
		messageUser.style.color = '#f58700';
		messageUser.style.textDecoration = 'underline';
	}
	messageContent.innerText = c;
	chatContent.appendChild(viewMessage);
	chatContent.scrollTop = chatContent.scrollHeight;
}
const onMessageSubmit = () => {
	const value = chatInput.value.trim();
	if (value.trim().length > 0) {
		chatInput.value = '';

		showMessage(player.username, value);
		setNewMessagesCounter(newMessagesCounter + 1);

		socket.emit('message', value);
	}
};

function showCardEffect(effectType, cardIndex) {
	cards.forEach((card) => {
		Object.values(CARD_EFFECTS).forEach((effect) => {
			if (effect.number !== CARD_EFFECTS.NOTHING.number) {
				card.children[0].classList.remove(effect.className);
			}
		});
	});
	if (effectType === 0) return;

	const effect = Object.values(CARD_EFFECTS).find((eff) => eff.number === effectType);
	showMessage('SYSTEM', `${roomData.players[roomData.lier].username} is showing ${effect.name} on card ${cardIndexToLetter(cardIndex)}!`, (system = true));

	cards[cardIndex].children[0].classList.add(effect.className);
}

// Listening to sending messages
chatButton.addEventListener('click', onMessageSubmit);
chatInput.addEventListener('keypress', function (e) {
	if (e.key === 'Enter') {
		onMessageSubmit();
	}
});

// Listening to create room
const onCreate = () => {
	socket.emit('create', {
		username: usernameInput.value,
		shape: currentJoinOrCreateShapeIndex,
		color: currentJoinOrCreateColorIndex,
		timePerRound: Number.parseInt(timePerRoundInput.value),
		maxRounds: Number.parseInt(numberOfRoundsInput.value),
		maxPlayers: Number.parseInt(maxPlayersInput.value),
	});
};
createButton.addEventListener('click', onCreate);

// Listening to join room
const onJoin = () => {
	socket.emit('join', { roomId: joinRoomInput.value, username: usernameInput.value, shape: currentJoinOrCreateShapeIndex, color: currentJoinOrCreateColorIndex });
};
joinButton.addEventListener('click', onJoin);
joinRoomInput.addEventListener('keypress', (e) => {
	if (e.key === 'Enter') {
		onJoin();
	}
});
usernameInput.addEventListener('keypress', (e) => {
	if (e.key === 'Enter') {
		if (state === STATES.JOIN) {
			onJoin();
		} else if (state === STATES.CREATE) {
			onCreate();
		}
	}
});

roomIdTitle.addEventListener('click', () => {
	if (!roomData) return;
	const clickAnimation = () => {
		// success
		roomIdTitle.animate(
			[
				{
					transform: 'scale(1)',
				},
				{
					transform: 'scale(0.97)',
				},
				{
					transform: 'scale(1.03)',
				},
			],
			{
				duration: 250,
				iterations: 1,
			}
		);
	};
	// If sharing is possible
	if (navigator.share) {
		const shareData = {
			title: 'Shnook',
			text: 'Play Shnook against your friends!',
			url: document.location,
		};
		navigator.share(shareData).then(clickAnimation);
	} else if (navigator.clipboard) {
		// If sharing is not possible
		navigator.clipboard.writeText(document.location).then(clickAnimation);
		// Only adding 'copied' if the browser does not support sharing
		roomIdTitle.classList.add('room-id-title-copied');
		setTimeout(() => {
			roomIdTitle.classList.remove('room-id-title-copied');
		}, 800);
	}
});

ownerStartButton.addEventListener('click', () => {
	if (isAdmin) {
		socket.emit('start');
		ownerStartButton.animate(
			[
				{
					transform: 'translateY(-20%)',
				},
				{
					transform: 'translateY(200%)',
				},
				{
					transform: 'translateY(-100vh)',
				},
			],
			{
				duration: 400,
				iterations: 1,
			}
		);
		ownerStartButton.style.transform = 'translateY(-10000%)';
		document.querySelectorAll('.player-li').forEach((playerLi) => {
			playerLi.childNodes[0].textContent = playerLi.getAttribute('data-username');
		});
	}
});

leftShapeArrow.addEventListener('click', () => {
	currentJoinOrCreateShapeIndex -= 1 - SHAPES.length;
	currentJoinOrCreateShapeIndex %= SHAPES.length;
	avatarImage.src = SHAPES[currentJoinOrCreateShapeIndex].path;
});
rightShapeArrow.addEventListener('click', () => {
	currentJoinOrCreateShapeIndex += 1;
	currentJoinOrCreateShapeIndex %= SHAPES.length;
	avatarImage.src = SHAPES[currentJoinOrCreateShapeIndex].path;
});

avatarColor.children[0].style.fill = AVATAR_COLORS[currentJoinOrCreateColorIndex].color;
avatarImage.style.filter = AVATAR_COLORS[currentJoinOrCreateColorIndex].filter;
leftColorArrow.addEventListener('click', () => {
	currentJoinOrCreateColorIndex -= 1 - AVATAR_COLORS.length;
	currentJoinOrCreateColorIndex %= AVATAR_COLORS.length;
	avatarColor.children[0].style.fill = AVATAR_COLORS[currentJoinOrCreateColorIndex].color;
	avatarImage.style.filter = AVATAR_COLORS[currentJoinOrCreateColorIndex].filter;
});
rightColorArrow.addEventListener('click', () => {
	currentJoinOrCreateColorIndex += 1;
	currentJoinOrCreateColorIndex %= AVATAR_COLORS.length;
	avatarColor.children[0].style.fill = AVATAR_COLORS[currentJoinOrCreateColorIndex].color;
	avatarImage.style.filter = AVATAR_COLORS[currentJoinOrCreateColorIndex].filter;
});

function getTimestamp() {
	return Math.floor(new Date().getTime() / 1000);
}

function createTinyAvatar(shapeId, colorId, index = -1) {
	const avatarParent = document.createElement('div');
	const tinyAvatarBody = document.createElement('div');
	const tinyAvatarEye1 = document.createElement('div');
	const tinyAvatarEye2 = document.createElement('div');

	avatarParent.classList.add('tiny-avatar');
	tinyAvatarBody.classList.add('tiny-avatar-body');
	tinyAvatarEye1.classList.add('tiny-avatar-eyes');
	tinyAvatarEye2.classList.add('tiny-avatar-eyes');

	const tinyEyeAnimation = [
		{
			transform: 'scaleY(1)',
		},
		{
			transform: 'scaleY(1)',
		},
		{
			transform: 'scaleY(1)',
		},
		{
			transform: 'scaleY(0.2)',
		},
		{
			transform: 'scaleY(1)',
		},
		{
			transform: 'scaleY(1)',
		},
		{
			transform: 'scaleY(1)',
		},
	];
	const tinyEyeAnimationOptions = { duration: 1200, endDelay: Math.floor(Math.random() * 8000) + 2200, delay: Math.floor(Math.random() * 2000), iterations: Infinity };

	tinyAvatarEye1.animate(tinyEyeAnimation, tinyEyeAnimationOptions);
	tinyAvatarEye2.animate(tinyEyeAnimation, tinyEyeAnimationOptions);

	tinyAvatarBody.style.backgroundImage = `url(${SHAPES[shapeId].path})`;
	tinyAvatarBody.style.filter = AVATAR_COLORS[colorId].filter;

	avatarParent.appendChild(tinyAvatarBody);
	avatarParent.appendChild(tinyAvatarEye1);
	avatarParent.appendChild(tinyAvatarEye2);

	if (index !== -1) {
		avatarParent.classList.add('tiny-avatar-vote');
		avatarParent.style.right = `${index * 24}px`;
		avatarParent.style.zIndex = 99 - index;

		avatarParent.animate([{ transform: 'translateY(0) scaleY(1)' }, { transform: 'translateY(0) scaleY(1)' }, { transform: 'translateY(0) scaleY(1)' }, { transform: 'translateY(0) scaleY(0.95)' }, { transform: 'translateY(-10px) scaleY(1.05)' }, { transform: 'translateY(-8px) scaleY(1)' }, { transform: 'translateY(0) scaleY(1)' }, { transform: 'translateY(0) scaleY(1)' }, { transform: 'translateY(0) scaleY(1)' }, { transform: 'translateY(0) scaleY(1)' }], {
			duration: 1000,
			endDelay: Math.floor(Math.random() * 3000) + 2200,
			delay: Math.floor(Math.random() * 2000),
			iterations: Infinity,
		});
	}

	return avatarParent;
}

function createPlayerElement(p) {
	const playerElement = document.createElement('div');
	const pointsElement = document.createElement('span');
	const guessElement = document.createElement('span');

	playerElement.setAttribute('data-username', p.username);

	playerElement.classList.add('player-li');
	pointsElement.classList.add('player-li-points');
	guessElement.classList.add('player-li-guess');

	playerElement.innerText = p.username;

	if (p.username === player.username) {
		playerElement.style.backgroundColor = '#acacac';
	}

	playerElement.appendChild(guessElement);
	playerElement.appendChild(pointsElement);
	pointsElement.innerText = `score: ${p.score || '#'}`;
	playerElement.appendChild(createTinyAvatar(p.shape, p.color));

	return playerElement;
}

function update(isStart = false) {
	roomIdTitle.innerText = `#${roomData.id}`;
	roomPlayers.innerText = `${roomData.players.length}/${roomData.maxPlayers}`;
	roomRounds.innerText = `${roomData.roundsPlayed}/${roomData.maxRounds}`;

	const orderedPlayers = roomData.players.slice().sort((a, b) => b.score - a.score);
	let height = 0;
	orderedPlayers.forEach((p, index) => {
		let playerElement = document.querySelector(`[data-username='${p.username}']`);
		if (playerElement === null) {
			playerElement = createPlayerElement(p);
			playersDiv.appendChild(playerElement);
		} else {
			if (roomData.lier !== null) {
				if (roomData.players[roomData.lier].username === p.username) {
					playerElement.style.color = 'purple';
				} else {
					playerElement.style.color = '#313131';
				}
			}
			if (isStart) {
				playerElement.classList.remove('player-doubling');
				playerElement.classList.remove('player-fiftying');
				playerElement.childNodes[0].textContent = playerElement.getAttribute('data-username');
			}
			playerElement.children[playerElement.children.length - 2].innerText = `score: ${p.score || '#'}`;
		}
		height = playerElement.clientHeight;
		playerElement.style.top = `${height * index}px`;
	});
	playersDiv.style.height = `${height * orderedPlayers.length}px`;

	const playerElements = document.querySelectorAll(`[data-username]`);
	playerElements.forEach((element) => {
		const playerElementId = roomData.players.findIndex((p) => p.username === element.getAttribute('data-username'));
		if (playerElementId === -1) {
			playersDiv.removeChild(element);
		}
	});

	// Game Over
	if (roomData.roundsPlayed === roomData.maxRounds) {
		winner = orderedPlayers[0];

		cards.forEach((cardElement, index) => {
			if (Number.isInteger(roomData.lastTreasure) && index !== roomData.lastTreasure) {
				cardElement.classList.add('wrong-card');
				cardElement.classList.remove('show-card');
			}
		});

		setTimeout(() => {
			cards.forEach((cardElement) => {
				cardElement.classList.remove('wrong-card');
				cardElement.classList.add('show-card');
			});

			sceneTransition(
				() => {
					setState(STATES.OVER);
				},
				'GG',
				1000
			);
		}, 1000);
	}

	if (roomData.hasStarted) {
		// Only getting the special that is "on"
		const specialsList = Object.entries(roomData.specials).filter((special) => special[1]);
		if (specialsList.length) {
			currentSpecial = specialsList[0][0];
		} else {
			currentSpecial = null;
		}
		if (roomData.lier !== null) {
			gameModeSpan.style.display = 'block';
			isGuessing = roomData.players[roomData.lier].username !== player.username;
			if (isGuessing) {
				gameModeSpan.innerText = 'Guess The Card!';
				gameModeSpan.style.backgroundColor = 'rgb(107, 222, 105)';
			} else {
				gameModeSpan.innerText = 'SHNOOK them all!';
				gameModeSpan.style.backgroundColor = 'rgb(107, 105, 222)';
			}

			const votes = [[], [], [], []];

			roomData.players.forEach((p, index) => {
				if (p.guess !== -1) {
					votes[p.guess].push(createTinyAvatar(p.shape, p.color, votes[p.guess].length));
				}
			});

			cards.forEach((card, index) => {
				if (player.guess === index) {
					card.classList.add('card-locked');
				} else {
					card.classList.remove('card-locked');
				}

				if (isGuessing) {
					new Array(...card.children[1].children).forEach((cardButton) => {
						cardButton.style.display = 'none';
					});
				} else {
					new Array(...card.children[1].children).forEach((cardButton) => {
						cardButton.style.display = 'block';
					});
				}

				card.children[2].children[0].style.backgroundSize = `auto ${(votes[index].length / roomData.players.length) * 50}%`;
				card.children[2].children[1].innerHTML = '';
				votes[index].forEach((voter) => {
					card.children[2].children[1].appendChild(voter);
				});
			});
		}

		roomData.players.forEach((player, index) => {
			const playerScoreElement = document.querySelector(`[data-username='${player.username}']`);
			// If lier and game is not over
			if (index === roomData.lier && roomData.roundsPlayed < roomData.maxRounds) {
				playerScoreElement.children[0].innerText = ' (lier)';
			}
			// If player didn't make a guess
			else if (player.guess !== -1) {
				playerScoreElement.children[0].innerText = ` (${cardIndexToLetter(player.guess)})`;
			} else {
				playerScoreElement.children[0].innerText = '';
			}
		});

		Object.values(SPECIALS).forEach((special) => {
			acceptableChallengeDiv.classList.remove(special.challengeDivClassName);
			themeDiv.classList.remove(special.themeDivClassName);
		});

		if (currentSpecial && SPECIALS[currentSpecial]) {
			themeDiv.classList.remove('main-theme-hidden');
			themeDiv.classList.add('main-theme-visib');

			themeDiv.classList.add(SPECIALS[currentSpecial].themeDivClassName);
			themeDiv.children[0].innerHTML = SPECIALS[currentSpecial].content;
			themeDiv.children[1].innerHTML = SPECIALS[currentSpecial].help;

			acceptableChallengeDiv.classList.add(SPECIALS[currentSpecial].challengeDivClassName);
		} else {
			themeDiv.classList.remove('main-theme-visib');
			themeDiv.classList.add('main-theme-hidden');
		}
	}

	isAdmin = roomData.players[0].username === player.username;
	if (isAdmin) {
		if (roomData.players.length >= 2) {
			ownerStartButton.style.display = 'inline';
		} else {
			ownerStartButton.style.display = 'none';
		}
	}
}

// Change state once joined
socket.on('joined', (stream) => {
	player = stream.player;
	roomData = stream.room;

	setState(STATES.PLAY);
	update();
});

// Change state once joined
socket.on('update', (stream) => {
	roomData = stream.room;
	update();
});

socket.on('accepted_special', ({ username, specialName, room }) => {
	roomData = room;
	update();

	SPECIALS[specialName].func(username);
});
socket.on('start', (stream) => {
	roomData = stream.room;

	if (state !== STATES.PLAY) setState(STATES.PLAY);

	chatContent.innerHTML = '';
	setNewMessagesCounter(0);
	if (timer !== null) {
		clearInterval(timer);
		timer = null;
	}

	cards.forEach((cardElement, index) => {
		if (Number.isInteger(roomData.lastTreasure) && index !== roomData.lastTreasure) {
			cardElement.classList.add('wrong-card');
			cardElement.classList.remove('show-card');
		}
	});

	setTimeout(() => {
		cards.forEach((cardElement) => {
			cardElement.classList.remove('wrong-card');
			cardElement.classList.add('show-card');
		});

		timer = setInterval(() => {
			const timestamp = getTimestamp();
			timerSpan.classList.remove('timer-go');
			const seconds = roomData.startedAt - timestamp + roomData.timePerRound - 1 + roomData.timeBetweenRounds;
			if (seconds >= roomData.timePerRound) {
				timerSpan.classList.add('timer-before-round');
				const timeShown = seconds - roomData.timePerRound + 1;
				if (timeShown === 0) {
					timerSpan.classList.add('timer-go');
					timerSpan.innerText = 'GO!';
				} else {
					timerSpan.innerText = timeShown;
				}
			} else {
				timerSpan.classList.remove('timer-before-round');
				timerSpan.innerText = seconds;
			}

			// If there are less than 3 seconds less to the round, remove the option to start an earthquake
			if (seconds <= 3 && currentSpecial === 'earthquake') {
				acceptableChallengeDivReject.click();
				roomData.specials.earthquake = false;
				update();
			} else if (seconds <= 0.6 && currentSpecial) {
				acceptableChallengeDivReject.click();
				Object.keys(roomData.specials).forEach((special) => {
					roomData.specials[special] = false;
				});
				update();
			}

			if (timerSpan.innerText === '0') {
				clearInterval(timer);
				timer = null;
			}
		}, 200);
	}, 1000);

	update(true);

	document.querySelectorAll('.card').forEach((element) => {
		element.classList.remove('secret-card');
		element.classList.remove('card-locked');
		player.guess = -1;
		element.children[2].children[0].style.backgroundSize = 'auto 0%';
	});

	challengeDiv.style.display = 'none';

	acceptableChallengeDiv.style.display = 'none';
	if (currentSpecial && SPECIALS[currentSpecial]) {
		SPECIALS[currentSpecial].setChallengeDiv(isGuessing);
	}

	challengeDiv.classList.remove('challenge-div-complete');
	acceptableChallengeDiv.classList.remove('challenge-div-complete');

	if (stream.treasure !== undefined) {
		document.querySelector(`.card:nth-of-type(${stream.treasure + 1})`).classList.add('secret-card');
		if (stream.challenge) {
			challengeDiv.style.display = 'flex';
			challengeDiv.children[0].innerText = `+${stream.challenge.bonus}`;
			challengeDiv.children[1].innerText = `Use ${Object.values(CARD_EFFECTS)[stream.challenge.effect].name} on the secret card for at least ${stream.challenge.time / 1000} seconds`;
			challengeDiv.children[2].innerText = '';
		}
	}

	showCardEffect(CARD_EFFECTS.NOTHING.number, -1);
});

socket.on('join_failed', (stream) => {
	joinFailSpan.innerText = 'Can not join room: ' + stream.error;
});

socket.on('message', (stream) => {
	showMessage(stream.user, stream.message);
	setNewMessagesCounter(newMessagesCounter + 1);
});

socket.on('effect', ({ effectType, cardIndex }) => {
	showCardEffect(effectType, cardIndex);
});

socket.on('success', ({ challenge }) => {
	challengeDiv.children[2].innerText = '✔';
	challengeDiv.classList.add('challenge-div-complete');
	challengeDiv.animate(
		[
			{
				transform: 'translateX(0%)',
			},
			{
				transform: 'translateX(-10%)',
			},
			{
				transform: 'translateX(0%)',
			},
			{
				transform: 'translateX(-100%)',
			},
		],
		{
			duration: 400,
			iterations: 1,
		}
	);
	const roomPlayer = roomData.players.find((p) => p.username === player.username);
	roomPlayer.score += challenge.bonus;

	if (player !== roomPlayer) {
		player.score += challenge.bonus;
	}

	update();
});

window.addEventListener('scroll', function () {
	const position = chatInput.getBoundingClientRect();

	// Hide comments count when chatInput is fully visible
	if (position.top >= 0 && position.bottom <= window.innerHeight) {
		setNewMessagesCounter(0);
	}
});

joinOrCreateSwapStateButton.addEventListener('click', () => {
	setState(state === STATES.JOIN ? STATES.CREATE : STATES.JOIN);
});

function updateTutorialPage(showAnimation = true) {
	tutorialDiv.children[1].scrollIntoView({ behavior: 'smooth', block: 'end' });

	const domUpdate = () => {
		tutorialDiv.children[0].children[0].innerText = `${TUTORIAL_PAGES[currentTutorialPage].title} (${currentTutorialPage + 1}/${TUTORIAL_PAGES.length})`;
		tutorialDiv.children[0].children[1].src = TUTORIAL_PAGES[currentTutorialPage].image;
		tutorialDiv.children[0].children[2].innerText = TUTORIAL_PAGES[currentTutorialPage].content;

		tutorialDiv.children[1].children[0].disabled = currentTutorialPage === 0;
		tutorialDiv.children[1].children[1].disabled = currentTutorialPage === TUTORIAL_PAGES.length - 1;
	};

	if (showAnimation) {
		new Array(...tutorialDiv.children[0].children).forEach((child) => {
			child.style.display = 'none';
			child.style.display = 'block';

			child.animate(
				[
					{
						opacity: 1,
						transform: 'translatey(0)',
					},
					{
						opacity: 0.3,
						transform: 'translatey(0)',
					},
					{
						opacity: 0,
						transform: 'translatey(200vh)',
					},
					{
						opacity: 0.5,
						transform: 'translatey(0)',
					},
					{
						opacity: 1,
						transform: 'translatey(0)',
					},
				],
				{
					duration: 500,
				}
			);
		});
	}

	setTimeout(domUpdate, 300);
}

// Back tutorial button
tutorialDiv.children[1].children[0].addEventListener('click', () => {
	currentTutorialPage -= 1;
	currentTutorialPage %= TUTORIAL_PAGES.length;
	updateTutorialPage();
});

// Forward tutorial button
tutorialDiv.children[1].children[1].addEventListener('click', () => {
	currentTutorialPage += 1;
	currentTutorialPage %= TUTORIAL_PAGES.length;
	updateTutorialPage();
});

// Close tutorial button
tutorialDiv.children[2].addEventListener('click', () => {
	currentTutorialPage = 0;
	tutorialDiv.classList.add('tutorial-div-hidden');
});

helpBtn.addEventListener('click', () => {
	localStorage.setItem('showTutorial', true);
	tutorialDiv.classList.remove('tutorial-div-hidden');
	updateTutorialPage(false);
});

updateTutorialPage();
// Function to call when state changes
function setState(s) {
	setNewMessagesCounter(0);
	if (s === STATES.JOIN || s === STATES.CREATE) {
		mainDiv.style.display = 'none';
		joinOrCreateDiv.style.display = 'block';
		ownerStartButton.style.display = 'none';
		roomInfoDiv.style.display = 'none';
		timerSpan.style.display = 'none';
		challengeDiv.style.display = 'none';
		acceptableChallengeDiv.style.display = 'none';

		roomIdTitle.innerText = '';
		roomPlayers.innerText = '';
		roomRounds.innerText = '';

		if (timer !== null) {
			clearInterval(timer);
			timer = null;
		}

		if (s === STATES.JOIN) {
			joinForm.scrollIntoView({ behavior: 'smooth', block: 'end' });
			joinOrCreateSwapStateButton.style.transform = 'rotateY(0deg)';
			history.pushState({}, '', '/join');
		} else {
			createForm.scrollIntoView({ behavior: 'smooth', block: 'end' });
			joinOrCreateSwapStateButton.style.transform = 'rotateY(180deg)';
			history.pushState({}, '', '/create');
		}
	} else if (s === STATES.PLAY) {
		// Looks a lot better with this transition
		sceneTransition(
			() => {
				mainDiv.style.display = 'block';
				roomInfoDiv.style.display = 'flex';
				mainCards.style.display = 'flex';
				gameModeSpan.style.display = 'none';
				joinOrCreateDiv.style.display = 'none';
				timerSpan.style.display = 'flex';
				timerSpan.innerText = roomData.timePerRound;
				history.pushState({}, '', `/game/${roomData.id}`);
			},
			"Let's Go!",
			1000
		);

		// Show tutorial div if user hasn't seen the tutorial yet
		if (!localStorage.getItem('showTutorial')) {
			localStorage.setItem('showTutorial', true);

			tutorialDiv.classList.remove('tutorial-div-hidden');
			updateTutorialPage(false);
		}
	} else if (s === STATES.OVER) {
		mainCards.style.display = 'none';
		roomInfoDiv.style.display = 'flex';
		gameModeSpan.style.display = 'none';
		challengeDiv.style.display = 'none';
		acceptableChallengeDiv.style.display = 'none';
		themeDiv.classList.add('main-theme-hidden');
		themeDiv.classList.remove('main-theme-visib');
		if (isAdmin) {
			ownerStartButton.innerText = 'restart';
			ownerStartButton.style.transform = '';
		}
		const playerElement = document.querySelector(`[data-username='${winner.username}']`);
		playerElement.innerHTML = '👑 ' + playerElement.innerHTML;
		chatContent.innerHTML = '';

		document.querySelectorAll('.player-li').forEach((playerLi) => {
			playerLi.style.color = null;
			playerLi.children[0].innerText = '';
			playerLi.classList.remove('player-doubling');
			playerLi.classList.remove('player-fiftying');
		});

		history.pushState({}, '', `/game/${roomData.id}`);
	} else {
		throw Error('Invalid state');
	}
	state = s;
}

function matchStateToLocation() {
	const path = document.location.pathname;
	if (IS_RIGHT_PATH.JOIN(path)) {
		setState(STATES.JOIN);
	} else if (IS_RIGHT_PATH.CREATE(path)) {
		setState(STATES.CREATE);
	} else {
		setState(STATES.JOIN);
		joinRoomInput.value = `#${path.substring(6)}`;
	}
}

window.onpopstate = (data) => {
	if (state === STATES.OVER || state === STATES.PLAY) {
		document.location.reload();
		return;
	}
	matchStateToLocation();
};

matchStateToLocation();
