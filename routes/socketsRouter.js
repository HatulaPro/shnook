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
		let challengeTimer = null;

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
			if (room.players.size < 2) return;

			gameTimer = setInterval(() => {
				room.roundsPlayed += 1;
				if (!io.sockets.adapter.rooms.has(room.id)) {
					clearInterval(gameTimer);
					return;
				}

				if (room.roundsPlayed >= room.maxRounds) {
					clearInterval(gameTimer);
					room.adjustScore();
					io.to(room.id).emit('update', { room: room.getStatus() });
					return;
				}
				room.startRound();
				const lier = room.getLierSocketId();
				io.to(room.id).except(lier).emit('start', { room: room.getStatus() });
				io.to(lier).emit('start', { room: room.getStatus(), treasure: room.treasure, challenge: room.challenge });

				if (challengeTimer) {
					clearTimeout(challengeTimer);
					challengeTimer = null;
				}
			}, (room.timePerRound + Room.TIME_BETWEEN_ROUNDS) * 1000);

			room.start();
			const lier = room.getLierSocketId();
			io.to(room.id).except(lier).emit('start', { room: room.getStatus() });
			io.to(lier).emit('start', { room: room.getStatus(), treasure: room.treasure, challenge: room.challenge });
		});

		socket.on('guess', (cardIndex) => {
			if (!loggedIn()) return;
			if (!room.hasStarted) return;
			if (!Number.isInteger(cardIndex)) return;
			if (socket.id === room.getLierSocketId()) return;
			if (cardIndex < 0 || cardIndex > 3) return;

			player.guess = cardIndex;
			room.players.set(socket.id, player);
			io.to(room.id).emit('update', { room: room.getStatus() });
		});

		/*
		Effect Types: 
		0: Nothing
		1: Crown
		2: Confetti
		*/
		socket.on('effect', ({ effectType, cardIndex }) => {
			if (!loggedIn()) return;
			if (!room.hasStarted) return;
			if (!Number.isInteger(effectType)) return;
			if (!Number.isInteger(cardIndex)) return;
			if (cardIndex < 0 || cardIndex > 3) return;
			if (socket.id !== room.getLierSocketId()) return;
			if (effectType < 0 || effectType > 2) return;

			room.applyEffect(effectType, cardIndex);

			if (challengeTimer) {
				clearTimeout(challengeTimer);
				challengeTimer = null;
			}
			if (room.challenge && room.lastEffect) {
				if (room.lastEffect.effectType === room.challenge.effect && room.treasure === room.lastEffect.cardIndex) {
					challengeTimer = setTimeout(() => {
						if (new Date().getTime() - room.lastEffect.added * 1000 >= room.challenge.time) {
							io.to(room.getLierSocketId()).emit('success', { challenge: room.challenge });
							room.playersList()[room.lier].score += room.challenge.bonus;
						}
					}, room.challenge.time);
				}
			}

			io.to(room.id).emit('effect', { effectType, cardIndex });
		});

		socket.on('message', (stream) => {
			if (!loggedIn()) return;
			if (typeof stream !== 'string') return;
			stream = stream.trim();
			if (stream.length === 0) return;
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
