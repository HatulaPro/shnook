/// <reference path="../socket.io.min.js" />
const gameId = document.location.toString().split('/').pop();

const socket = io();

const STATES = {
	JOIN_OR_CREATE: 0,
	PLAY: 1,
};

let state = null;
let player = null;
let isAdmin = false;
let isGuessing = false;
let roomData = null;
let timer = null;

const mainDiv = document.querySelector('.main');
const roomIdTitle = document.querySelector('#room-id-title');
const roomPlayers = document.querySelector('#room-players');
const joinOrCreateDiv = document.querySelector('.join-or-create');

const createButton = document.querySelector('.create-form button');
const joinButton = document.querySelector('.join-form button');
const joinRoomInput = document.querySelector('.join-form input');
const joinFailSpan = document.querySelector('.join-fail');

const chatInput = document.querySelector('#chat-input');
const chatButton = document.querySelector('#chat-button');
const chatContent = document.querySelector('.chat-content');

const ownerStartButton = document.querySelector('#room-owner-start');
const timerSpan = document.querySelector('#room-timer');
const gameModeSpan = document.querySelector('#game-mode-span');

function showMessage(p, c) {
	const viewMessage = document.createElement('p');
	const messageUser = document.createElement('span');
	const messageContent = document.createElement('span');
	messageUser.style.color = 'blue';
	viewMessage.appendChild(messageUser);
	viewMessage.appendChild(messageContent);

	messageUser.innerText = `[${p}]: `;
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

function showGameModeSpan() {
	gameModeSpan.style.display = 'block';
	gameModeSpan.animate(
		[
			{
				transform: 'scale(1)',
			},
			{
				transform: 'scale(1.6)',
				borderRadius: '999999px',
			},
		],
		{ duration: 350, iterations: 1, direction: 'alternate-reverse' }
	);
}

function update() {
	roomIdTitle.innerText = `#${roomData.id}`;
	roomPlayers.innerText = `${roomData.players.length}/${roomData.maxPlayers}`;

	document.querySelectorAll('.card').forEach((element) => {
		element.classList.remove('secret-card');
	});
	if (roomData.hasStarted) {
		console.log(roomData);
		isGuessing = roomData.players[roomData.lier].username !== player.username;
		if (isGuessing) {
			gameModeSpan.innerText = 'Guess The Card!';
			gameModeSpan.style.backgroundColor = 'rgb(107, 222, 105)';
		} else {
			gameModeSpan.innerText = 'SHNOOK them all!';
			gameModeSpan.style.backgroundColor = 'rgb(107, 105, 222)';
		}
		showGameModeSpan();
	}

	isAdmin = roomData.players[0].username === player.username;
	if (isAdmin) {
		ownerStartButton.style.display = 'inline';
	}
	console.log(roomData.startedAt);
}

// Change state once joined
socket.on('joined', (stream) => {
	console.log(stream);
	player = stream.player;
	roomData = stream.room;

	setState(STATES.PLAY);
	update();
});

// Change state once joined
socket.on('update', (stream) => {
	console.log('update: ', stream);
	roomData = stream.room;
	update();
});

socket.on('start', (stream) => {
	console.log('start: ', stream);
	roomData = stream.room;

	chatContent.innerHTML = '';
	if (timer !== null) clearInterval(timer);
	timer = setInterval(() => {
		timerSpan.innerText = roomData.startedAt - getTimestamp() + roomData.timePerRound;
		if (timerSpan.innerText === '0') {
			clearInterval(timer);
			timer = null;
		}
	}, 500);

	update();

	if (stream.treasure) {
		document.querySelector(`.card:nth-of-type(${stream.treasure})`).classList.add('secret-card');
	}
});

socket.on('join_failed', (stream) => {
	joinFailSpan.innerText = 'Can not join room: ' + stream.error;
});

socket.on('message', (stream) => {
	showMessage(stream.user, stream.message);
});

socket.on('treasure', ({ treasure }) => {});

// Function to call when state changes
function setState(s) {
	if (s === STATES.JOIN_OR_CREATE) {
		mainDiv.style.display = 'none';
		joinOrCreateDiv.style.display = 'flex';
		ownerStartButton.style.display = 'none';
		timerSpan.style.display = 'none';
	} else if (s === STATES.PLAY) {
		// gameModeSpan.style.display = 'block';
		mainDiv.style.display = 'block';
		joinOrCreateDiv.style.display = 'none';
		timerSpan.style.display = 'flex';
	} else {
		throw Error('Invalid state');
	}
}

setState(STATES.JOIN_OR_CREATE);
