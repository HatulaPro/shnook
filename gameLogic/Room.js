module.exports = class Room {
	static rooms = new Map();
	static MAX_PLAYERS = 10;

	// players: a map of socket to info
	constructor(id, maxPlayers, hasStarted, players = {}) {
		this.maxPlayers = maxPlayers;
		this.players = players;
		this.hasStarted = hasStarted;
		this.id = id;
	}

	async addToRoom(player) {}
};
