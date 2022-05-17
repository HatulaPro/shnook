function getRandom(list) {
	return list[Math.floor(Math.random() * list.length)];
}

function getTimestamp() {
	return Math.floor(new Date().getTime() / 1000);
}

module.exports = class Room {
	static rooms = new Map();
	static MAX_PLAYERS = 10;
	static MAX_ROUNDS = 3;
	static TIME_PER_ROUND = 4;

	// players: a map of socket to info
	constructor(id, maxPlayers, timePerRound, maxRounds, hasStarted, socketId, player) {
		this.maxPlayers = maxPlayers;
		this.timePerRound = timePerRound;
		this.maxRounds = maxRounds;
		this.startedAt = null;
		this.players = new Map();
		this.players.set(socketId, player);

		this.hasStarted = hasStarted;
		this.id = id;
		this.lier = null;
		this.treasure = null;
		this.roundsPlayed = 0;
	}

	playersSockets() {
		return Array.from(this.players.keys());
	}

	playersList() {
		return Array.from(this.players.values());
	}

	isAdmin({ username }) {
		return this.playersList()[0].username === username;
	}

	getLierSocketId() {
		const username = this.playersList()[this.lier].username;
		let result = null;
		this.players.forEach((value, key) => {
			if (value.username === username) {
				result = key;
			}
		});
		return result;
	}

	startRound(isFirst = false) {
		if (isFirst) {
			this.lier = 0;
		} else {
			this.lier = Math.floor(Math.random() * this.players.size);
		}
		this.startedAt = getTimestamp();
		this.treasure = Math.floor(Math.random() * 4);
	}

	start() {
		this.hasStarted = true;
		this.startRound(true);
	}

	getStatus() {
		return {
			maxPlayers: this.maxPlayers,
			timePerRound: this.timePerRound,
			players: this.playersList(),
			hasStarted: this.hasStarted,
			startedAt: this.startedAt,
			id: this.id,
			lier: this.lier,
			roundsPlayed: this.roundsPlayed,
		};
	}
};
