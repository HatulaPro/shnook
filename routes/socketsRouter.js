const express = require('express');
const { nanoid } = require('nanoid');
const Room = require('../gameLogic/Room');

function genUsername() {
	return `guest_${Math.floor(Math.random() * 100000)}`;
}

module.exports = (io) => {
	io.on('connection', (socket) => {
		let player = null;
		let room = null;

		const loggedIn = () => {
			return player !== null;
		};

		socket.on('create', (stream) => {
			const id = nanoid(6);
			player = { username: genUsername() };
			room = new Room(id, Room.MAX_PLAYERS, false, { [socket.id]: player });

			socket.join(id);
			socket.emit('joined', { id, player });

			Room.rooms.set(id, room);
		});

		socket.on('join', async (stream) => {
			if (Room.rooms.has(stream)) {
				player = { username: genUsername() };
				room = Room.rooms.get(stream);

				socket.join(stream);
				socket.emit('joined', { stream, player });

				room.players[socket.id] = player;
			} else {
				socket.emit('join_failed', { error: 'room does not exist' });
			}
		});

		socket.on('message', (stream) => {
			if (!loggedIn()) return;
			socket.broadcast.to(room.id).emit('message', { user: player.username, message: stream });
		});

		socket.on('disconnecting', () => {
			socket.rooms.forEach((room) => {
				if (Room.rooms.has(room)) {
					delete Room.rooms.get(room).players[socket.id];
					if (Object.keys(Room.rooms.get(room).players).length === 0) {
						delete Room.rooms.get(room);
					}
				}
			});
		});
	});
};
