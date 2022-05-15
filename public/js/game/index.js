/// <reference path="../socket.io.min.js" />
const gameId = document.location.toString().split('/').pop();

const socket = io();
// socket.emit('join', gameId);

const STATES = {
	JOIN_OR_CREATE: 0,
	PLAY: 1,
};

let state = null;
let player = null;
let roomId = null;

const mainDiv = document.querySelector('.main');
const secondaryTitle = document.querySelector('.secondary-title');
const joinOrCreateDiv = document.querySelector('.join-or-create');

const createButton = document.querySelector('.create-form button');
const joinButton = document.querySelector('.join-form button');
const joinRoomInput = document.querySelector('.join-form input');
const joinFailSpan = document.querySelector('.join-fail');

const chatInput = document.querySelector('#chat-input');
const chatButton = document.querySelector('#chat-button');
const chatContent = document.querySelector('.chat-content');

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
}
const onMessageSubmit = () => {
	const value = chatInput.value;
	chatInput.value = '';

	showMessage(player.username, value);

	socket.emit('message', value);
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

// Change state once joined
socket.on('joined', (stream) => {
	player = stream.player;
	roomId = stream.id;
	secondaryTitle.innerText = `#${roomId}`;
	console.log(stream);
	setState(STATES.PLAY);
});

socket.on('join_failed', (stream) => {
	joinFailSpan.innerText = 'Can not join room: ' + stream.error;
});

socket.on('message', (stream) => {
	showMessage(stream.user, stream.message);
});

// Function to call when state changes
function setState(s) {
	if (s === STATES.JOIN_OR_CREATE) {
		mainDiv.style.display = 'none';
		joinOrCreateDiv.style.display = 'flex';
	} else if (s === STATES.PLAY) {
		mainDiv.style.display = 'flex';
		joinOrCreateDiv.style.display = 'none';
	} else {
		throw Error('Invalid state');
	}
}

setState(STATES.JOIN_OR_CREATE);
