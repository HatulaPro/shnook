const { nanoid } = require('nanoid');
const Room = require('../gameLogic/Room');

function validateUsername(username) {
	if (username.length < 2 || username.length > 14) {
		return 'Username must be 2-14 characters long';
	}
	if (!username.match(/^[a-zA-Z0-9 ]*$/)) {
		return 'Username can only contain letters, numbers and spaces';
	}
	return true;
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

		// TODO: destructuring breaks when the stream is undefined
		socket.on('create', ({ username }) => {
			if (typeof username !== 'string') return;
			username = username.trim();
			const errorMsg = validateUsername(username);
			if (errorMsg !== true) {
				io.to(socket.id).emit('join_failed', { error: errorMsg });
				return;
			}
			const id = nanoid(6);
			player = { username };
			room = new Room(id, Room.MAX_PLAYERS, Room.TIME_PER_ROUND, Room.MAX_ROUNDS, false, socket.id, player);

			socket.join(id);
			io.to(socket.id).emit('joined', { id, player, room: room.getStatus() });

			Room.rooms.set(id, room);
		});

		socket.on('join', async ({ roomId, username }) => {
			if (typeof roomId !== 'string') return;
			if (typeof username !== 'string') return;
			if (roomId.length > 0 && roomId[0] === '#') {
				roomId = roomId.trim().substring(1);
			}
			username = username.trim();
			const errorMsg = validateUsername(username);
			if (errorMsg !== true) {
				io.to(socket.id).emit('join_failed', { error: errorMsg });
				return;
			}
			if (Room.rooms.has(roomId)) {
				room = Room.rooms.get(roomId);
				if (room.hasUsername(username)) {
					io.to(socket.id).emit('join_failed', { error: 'Username is taken' });
					return;
				}

				player = { username };

				if (room.hasStarted) return io.to(socket.id).emit('join_failed', { error: 'game has already started' });
				if (room.players.size >= room.maxPlayers) return io.to(socket.id).emit('join_failed', { error: 'room is full' });

				room.players.set(socket.id, player);

				socket.join(roomId);
				io.to(socket.id).emit('joined', { id: roomId, player, room: room.getStatus() });
				socket.to(room.id).emit('update', { room: room.getStatus() });
			} else {
				io.to(socket.id).emit('join_failed', { error: 'room does not exist' });
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

				// Game Over
				if (room.roundsPlayed >= room.maxRounds) {
					clearInterval(gameTimer);
					room.gameOver();
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
			if (effectType < 0 || effectType > Room.NUMBER_OF_CHALLENGES) return;

			room.applyEffect(effectType, cardIndex);

			if (challengeTimer) {
				clearTimeout(challengeTimer);
				challengeTimer = null;
			}
			if (room.challenge && room.lastEffect) {
				if (room.lastEffect.effectType === room.challenge.effect && room.treasure === room.lastEffect.cardIndex) {
					challengeTimer = setTimeout(() => {
						try {
							if (new Date().getTime() - room.lastEffect.added * 1000 >= room.challenge.time) {
								io.to(room.getLierSocketId()).emit('success', { challenge: room.challenge });
								room.playersList()[room.lier].score += room.challenge.bonus;
								room.challenge = null;
							}
						} catch (e) {
							// In case room.lastEffect has changed during execution
							console.log(e);
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
					socket.broadcast.to(room.id).emit('update', { room: Room.rooms.get(room).getStatus() });
					if (Room.rooms.get(room).players.size === 0) {
						Room.rooms.delete(room);
					}
				}
				socket.leave(room);
			});
		});
	});
};
