function getTimestamp() {
	return Math.floor(new Date().getTime() / 1000);
}

module.exports = class Room {
	static rooms = new Map();
	static MAX_PLAYERS = 10;
	static MAX_ROUNDS = 3;
	static TIME_PER_ROUND = 10;
	static TIME_BETWEEN_ROUNDS = 3;
	static CHANCE_OF_CHALLENGE = 1.0;

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
		this.lastEffect = null;
		this.challenge = null;
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

	applyEffect(effectType, cardIndex) {
		if (effectType === 0) {
			this.lastEffect = null;
			return;
		}
		this.lastEffect = { effectType, cardIndex, added: getTimestamp() };
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
		this.players.forEach((player) => {
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
		this.players.forEach((player) => {
			player.guess = -1;
		});
		this.startedAt = getTimestamp();
		this.treasure = Math.floor(Math.random() * 4);
		this.challenge = this.generateChallenge();
		this.lastEffect = null;
	}

	generateChallenge() {
		if (Math.random() > Room.CHANCE_OF_CHALLENGE) return null;
		// TODO: More challenges
		return { effect: 1, time: 5000, bonus: 300 };
	}

	start() {
		this.hasStarted = true;
		this.players.forEach((player) => {
			player.score = 0;
		});
		this.startRound(true);
	}

	getStatus() {
		return {
			maxPlayers: this.maxPlayers,
			maxRounds: this.maxRounds,
			timePerRound: this.timePerRound,
			timeBetweenRounds: Room.TIME_BETWEEN_ROUNDS,
			players: this.playersList(),
			hasStarted: this.hasStarted,
			startedAt: this.startedAt,
			id: this.id,
			lier: this.lier,
			roundsPlayed: this.roundsPlayed,
		};
	}
};
