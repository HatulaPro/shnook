function getRandom(list) {
	return list[Math.floor(Math.random() * list.length)];
}

function getTimestamp() {
	return Math.floor(new Date().getTime() / 1000);
}

module.exports = class Room {
	static rooms = new Map();
	static MAX_PLAYERS = 10;
	static TIME_PER_ROUND = 30;

	// players: a map of socket to info
	constructor(id, maxPlayers, timePerRound, hasStarted, socketId, player) {
		this.maxPlayers = maxPlayers;
		this.timePerRound = timePerRound;
		this.startedAt = null;
		this.players = new Map();
		this.players.set(socketId, player);

		this.hasStarted = hasStarted;
		this.id = id;
		this.lier = null;
		this.treasure = null;
	}

	playersSockets() {
		return Array.from(this.players.keys());
	}

	playersList() {
		return Array.from(this.players.values());
	}

	start() {
		this.hasStarted = true;
		this.lier = 0;
		this.treasure = getRandom(1, 2, 3, 4);
		this.startedAt = getTimestamp();
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
		};
	}
};
