/// <reference path="../socket.io.min.js" />
const socket = io();
const STATES = {
	JOIN: 0,
	CREATE: 1,
	PLAY: 2,
	OVER: 3,
};
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
};

let player = null;
let isAdmin = false;
let isGuessing = false;
let roomData = null;
let timer = null;
let winner = null;

const mainDiv = document.querySelector('.main');
const roomIdTitle = document.querySelector('#room-id-title');
const roomPlayers = document.querySelector('#room-players');
const roomRounds = document.querySelector('#room-rounds');
const joinOrCreateDiv = document.querySelector('.join-or-create-options');
const joinForm = document.querySelector('.join-form');
const createForm = document.querySelector('.create-form');
const joinOrCreateSwapStateButton = document.querySelector('.join-or-create-swap');

const createButton = document.querySelector('.create-form button');
const joinButton = document.querySelector('.join-form button');
const joinRoomInput = document.querySelector('.join-form input');
const joinFailSpan = document.querySelector('.join-fail');

const chatInput = document.querySelector('#chat-input');
const chatButton = document.querySelector('#chat-button');
const chatContent = document.querySelector('.chat-content');

const playersDiv = document.querySelector('.main-players');

const ownerStartButton = document.querySelector('#room-owner-start');
const timerSpan = document.querySelector('#room-timer');
const gameModeSpan = document.querySelector('#game-mode-span');

const challengeDiv = document.querySelector('.challenge-div');

const cards = document.querySelectorAll('.card');
const mainCards = document.querySelector('.main-cards');
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

	new Array(...card.children[2].children).forEach((cardButton, buttonIndex) => {
		cardButton.style.backgroundImage = `url(${Object.values(CARD_EFFECTS)[buttonIndex].image})`;
		cardButton.style.display = 'none';
		cardButton.addEventListener('click', () => {
			if (roomData && player && roomData.hasStarted && !isGuessing) {
				socket.emit('effect', { effectType: buttonIndex, cardIndex: i });
			}
		});
	});
});
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
		if (roomData.hasStarted && p === roomData.players[roomData.lier].username) {
			messageUser.innerText = `[${p} (you, lier)]: `;
			messageUser.style.color = 'purple';
		}
	} else if (roomData.hasStarted && p === roomData.players[roomData.lier].username) {
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
	showMessage('SYSTEM', `${roomData.players[roomData.lier].username} is showing ${effect.name} on card ${String.fromCharCode('A'.charCodeAt(0) + cardIndex)}!`, (system = true));

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
createButton.addEventListener('click', () => {
	socket.emit('create');
});

// Listening to join room
const onJoin = () => {
	socket.emit('join', joinRoomInput.value);
};
joinButton.addEventListener('click', onJoin);
joinRoomInput.addEventListener('keypress', function (e) {
	if (e.key === 'Enter') {
		onJoin();
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
	}
});

function getTimestamp() {
	return Math.floor(new Date().getTime() / 1000);
}

function createPlayerElement(p) {
	const playerElement = document.createElement('div');
	const pointsElement = document.createElement('span');

	playerElement.setAttribute('data-username', p.username);

	playerElement.classList.add('player-li');

	playerElement.innerText = p.username;

	if (p.username === player.username) {
		playerElement.style.backgroundColor = '#acacac';
	}

	playerElement.appendChild(pointsElement);
	pointsElement.innerText = `score: ${p.score || '#'}`;

	return playerElement;
}

function update() {
	roomIdTitle.innerText = `#${roomData.id}`;
	roomPlayers.innerText = `${roomData.players.length}/${roomData.maxPlayers}`;
	roomRounds.innerText = `${roomData.roundsPlayed}/${roomData.maxRounds}`;

	// playersDiv.innerHTML = '';
	const orderedPlayers = roomData.players.slice().sort((a, b) => b.score - a.score);
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
			playerElement.children[playerElement.children.length - 1].innerText = `score: ${p.score || '#'}`;
		}
		playerElement.style.top = `${playerElement.clientHeight * index}px`;
	});

	// Game Over
	if (roomData.roundsPlayed === roomData.maxRounds) {
		winner = orderedPlayers[0];
		setState(STATES.OVER);
	}

	if (roomData.hasStarted) {
		gameModeSpan.style.display = 'block';
		isGuessing = roomData.players[roomData.lier].username !== player.username;
		if (isGuessing) {
			gameModeSpan.innerText = 'Guess The Card!';
			gameModeSpan.style.backgroundColor = 'rgb(107, 222, 105)';
		} else {
			gameModeSpan.innerText = 'SHNOOK them all!';
			gameModeSpan.style.backgroundColor = 'rgb(107, 105, 222)';
		}

		cards.forEach((card, index) => {
			card.children[1].innerText = '';
			if (player.guess === index) {
				card.classList.add('card-locked');
			} else {
				card.classList.remove('card-locked');
			}

			if (isGuessing) {
				new Array(...card.children[2].children).forEach((cardButton) => {
					cardButton.style.display = 'none';
				});
			} else {
				new Array(...card.children[2].children).forEach((cardButton) => {
					cardButton.style.display = 'block';
				});
			}
		});
		roomData.players.forEach((player) => {
			if (player.guess !== -1) {
				cards[player.guess].children[1].innerText += player.username + ' ';
			}
		});
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
	console.log(roomData);
	update();
});

socket.on('start', (stream) => {
	roomData = stream.room;

	chatContent.innerHTML = '';
	if (timer !== null) clearInterval(timer);
	timer = setInterval(() => {
		timerSpan.classList.remove('timer-go');
		const seconds = roomData.startedAt - getTimestamp() + roomData.timePerRound + roomData.timeBetweenRounds;
		if (seconds >= roomData.timePerRound) {
			timerSpan.classList.add('timer-before-round');
			const timeShown = seconds - roomData.timePerRound;
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
		if (timerSpan.innerText === '0') {
			clearInterval(timer);
			timer = null;
		}
	}, 500);

	update();

	document.querySelectorAll('.card').forEach((element) => {
		element.classList.remove('secret-card');
		element.classList.remove('card-locked');
		player.guess = -1;
	});

	challengeDiv.style.display = 'none';
	challengeDiv.classList.remove('challenge-div-complete');
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
});

socket.on('effect', ({ effectType, cardIndex }) => {
	showCardEffect(effectType, cardIndex);
});

socket.on('success', (challenge) => {
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
});

joinOrCreateSwapStateButton.addEventListener('click', () => {
	setState(state === STATES.JOIN ? STATES.CREATE : STATES.JOIN);
});

// Function to call when state changes
function setState(s) {
	if (s === STATES.JOIN || s === STATES.CREATE) {
		mainDiv.style.display = 'none';
		joinOrCreateDiv.style.display = 'block';
		ownerStartButton.style.display = 'none';
		timerSpan.style.display = 'none';
		challengeDiv.style.display = 'none';

		if (s === STATES.JOIN) {
			joinForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
			joinOrCreateSwapStateButton.style.transform = 'rotateY(0deg)';
		} else {
			createForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
			joinOrCreateSwapStateButton.style.transform = 'rotateY(180deg)';
		}
	} else if (s === STATES.PLAY) {
		mainDiv.style.display = 'block';
		mainCards.style.display = 'flex';
		gameModeSpan.style.display = 'none';
		joinOrCreateDiv.style.display = 'none';
		timerSpan.style.display = 'flex';
		timerSpan.innerText = roomData.timePerRound;
	} else if (s === STATES.OVER) {
		mainCards.style.display = 'none';
		gameModeSpan.style.display = 'none';
		challengeDiv.style.display = 'none';
		let playerElement = document.querySelector(`[data-username='${winner.username}']`);
		playerElement.innerText = '👑 ' + playerElement.innerText;
		chatContent.innerHTML = '';
	} else {
		throw Error('Invalid state');
	}
	state = s;
}

setState(state);
