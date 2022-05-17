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
		let gameTimer = null;

		const loggedIn = () => {
			return player !== null;
		};

		socket.on('create', (stream) => {
			const id = nanoid(6);
			player = { username: genUsername() };
			room = new Room(id, Room.MAX_PLAYERS, Room.TIME_PER_ROUND, Room.MAX_ROUNDS, false, socket.id, player);

			socket.join(id);
			socket.emit('joined', { id, player, room: room.getStatus() });

			Room.rooms.set(id, room);
		});

		socket.on('join', async (stream) => {
			if (typeof stream !== 'string') return;
			if (stream.length > 0 && stream[0] === '#') {
				stream = stream.trim().substring(1);
			}
			if (Room.rooms.has(stream)) {
				player = { username: genUsername() };
				room = Room.rooms.get(stream);
				if (room.hasStarted) return socket.emit('join_failed', { error: 'game has already started' });
				if (room.players.size >= room.maxPlayers) return socket.emit('join_failed', { error: 'room is full' });

				room.players.set(socket.id, player);

				socket.join(stream);
				socket.emit('joined', { id: stream, player, room: room.getStatus() });
				socket.broadcast.emit('update', { room: room.getStatus() });
			} else {
				socket.emit('join_failed', { error: 'room does not exist' });
			}
		});

		socket.on('start', () => {
			if (!loggedIn()) return;
			if (!room.isAdmin(player)) return;
			if (room.hasStarted) return;

			gameTimer = setInterval(() => {
				room.roundsPlayed += 1;
				if (room.roundsPlayed >= room.maxRounds) {
					clearInterval(gameTimer);
				} else {
					room.startRound();
					io.to(room.id).emit('start', { room: room.getStatus() });
				}
			}, room.timePerRound * 1000);

			room.start();

			io.to(room.id).emit('start', { room: room.getStatus() });
		});

		socket.on('message', (stream) => {
			if (!loggedIn()) return;
			socket.broadcast.to(room.id).emit('message', { user: player.username, message: stream });
		});

		socket.on('disconnecting', () => {
			socket.rooms.forEach((room) => {
				if (Room.rooms.has(room)) {
					Room.rooms.get(room).players.delete(socket.id);
					socket.broadcast.emit('update', { room: Room.rooms.get(room).getStatus() });
					if (Room.rooms.get(room).players.size === 0) {
						Room.rooms.delete(room);
					}
				}
			});
		});
	});
};
