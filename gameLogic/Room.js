function getRandom(list) {
	return list[Math.floor(Math.random() * list.length)];
}

module.exports = class Room {
	static rooms = new Map();
	static MAX_PLAYERS = 10;

	// players: a map of socket to info
	constructor(id, maxPlayers, hasStarted, socketId, player) {
		this.maxPlayers = maxPlayers;
		this.players = new Map();
		this.players.set(socketId, player);

		this.hasStarted = hasStarted;
		this.id = id;
		this.guesser = null;
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
		this.guesser = 0;
		this.treasure = getRandom(1, 2, 3, 4);
	}

	getStatus() {
		return {
			maxPlayers: this.maxPlayers,
			players: this.playersList(),
			hasStarted: this.hasStarted,
			id: this.id,
			guesser: this.guesser,
		};
	}
};
