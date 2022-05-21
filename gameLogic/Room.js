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
	static TIME_PER_ROUND = 15;

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

	adjustScore() {
		const lier = this.playersList()[this.lier];
		this.players.forEach((player, key) => {
			if (player.guess === this.treasure) {
				player.score += 1000;
				lier.score -= 200;
			} else {
				lier.score += 100;
				player.score -= 50;
			}
		});
	}

	startRound(isFirst = false) {
		if (isFirst) {
			this.lier = 0;
		} else {
			this.lier = Math.floor(Math.random() * this.players.size);
			this.adjustScore();
		}
		this.players.forEach((player, key) => {
			player.guess = -1;
		});
		this.startedAt = getTimestamp();
		this.treasure = Math.floor(Math.random() * 4);
	}

	start() {
		this.hasStarted = true;
		this.players.forEach((player, key) => {
			player.score = 0;
		});
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
