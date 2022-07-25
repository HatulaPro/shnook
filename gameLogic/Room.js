const Player = require('./Player');
const Special = require('./Special');
const Generals = require('./Generals');

module.exports = class Room {
	static rooms = new Map();
	static TIME_BETWEEN_ROUNDS = 4;

	static MIN_TIME_PER_ROUND = 5;
	static MAX_TIME_PER_ROUND = 60;

	static MIN_ROUNDS = 3;
	static MAX_ROUNDS = 20;

	static MIN_PLAYERS = 2;
	static MAX_PLAYERS = 12;

	static NUMBER_OF_SHAPES = 3;
	static NUMBER_OF_COLORS = 9;

	static NUMBER_OF_CHALLENGES = 3;
	static CHANCE_OF_CHALLENGE = 0.6;
	static CHANCE_OF_SPECIAL = 0.6;
	static SPECIALS = {
		doubling: new Special(
			false,
			'doubling',
			(player, isLier, room) => {
				player.scoringFactor = 2;
			},
			Special.WHO_SEES.players,
			false
		),
		earthquake: new Special(
			false,
			'earthquake',
			(player, isLier, room) => {
				room.specials.earthquake = false;
				room.playersList().forEach((p) => {
					p.guess = -1;
				});
			},
			Special.WHO_SEES.lier,
			true
		),
		fifty: new Special(
			false,
			'fifty',
			(player, isLier, room) => {
				// 3 options are the treasure, the other three aren't
				const options = [0, 1, 2, 3, room.treasure, room.treasure];
				player.guess = options[Math.floor(Math.random() * options.length)];
			},
			Special.WHO_SEES.players,
			false
		),
		switcheroo: new Special(
			false,
			'switcheroo',
			(player, isLier, room) => {
				const options = [0, 1, 2, 3];
				options.splice(room.treasure, 1);
				room.treasure = options[Math.floor(Math.random() * 3)];
				room.lastEffect = null;
			},
			Special.WHO_SEES.players,
			true
		),
	};

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
		this.lastTreasure = null;
		this.roundsPlayed = 0;
		this.lastEffect = null;
		this.challenge = null;
		this.defaultSpecials();
	}

	restart() {
		this.startedAt = null;
		this.players.forEach((player) => {
			player.gameReset();
		});
		this.lier = null;
		this.treasure = null;
		this.lastEffect = null;
		this.challenge = null;
		this.roundsPlayed = 0;
		this.defaultSpecials();
	}

	defaultSpecials() {
		this.specials = Object.fromEntries(Object.entries(Room.SPECIALS).map((entry) => [entry[0], entry[1].default]));
	}

	hasUsername(username) {
		for (const player of this.playersList()) {
			if (player.username === username) return true;
		}
		return false;
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
		this.lastEffect = { effectType, cardIndex, added: Generals.getTimestamp() };
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
		this.playersList().forEach((player, index) => {
			if (index === this.lier) return;
			if (player.guess === this.treasure) {
				player.score += 600 * player.scoringFactor;
				lier.score -= 200;
			} else {
				lier.score += 100;
				player.score -= 50 * player.scoringFactor;
			}
		});
	}

	startRound(isFirst = false) {
		if (isFirst) {
			this.lier = 0;
		} else {
			this.adjustScore();
			this.lier = (this.lier + 1) % this.players.size;
		}
		this.players.forEach((player) => {
			player.roundReset();
		});
		this.startedAt = Generals.getTimestamp();
		this.lastTreasure = this.treasure;
		this.treasure = Math.floor(Math.random() * 4);
		this.challenge = this.generateChallenge();
		this.lastEffect = null;

		this.defaultSpecials();
		if (Math.random() < Room.CHANCE_OF_SPECIAL) {
			const entries = Object.entries(this.specials);
			entries[Math.floor(Math.random() * entries.length)][1] = true;
			this.specials = Object.fromEntries(entries);
		}
	}

	gameOver() {
		this.adjustScore();
		this.players.forEach((player) => {
			player.guess = -1;
			this.lier = null;
			this.treasure = null;
			this.lastEffect = null;
			this.challenge = null;
		});
		this.hasStarted = false;
	}

	generateChallenge() {
		if (Math.random() > Room.CHANCE_OF_CHALLENGE) return null;

		const effect = Math.floor(Math.random() * Room.NUMBER_OF_CHALLENGES + 1);
		const time = Math.min((Math.floor(Math.random() * this.timePerRound * 0.7) + 1) * 1000, 8000);
		const bonus = Math.floor(Math.random() * Math.sqrt(time / 400) + 1) * 50;
		return {
			effect,
			time,
			bonus,
		};
	}

	applySpecial(specialName, player, isLier, callback) {
		if (this.specials[specialName] && !player.acceptedSpecial) {
			if ((Room.SPECIALS[specialName].whoSees === Special.WHO_SEES.lier && isLier) || (Room.SPECIALS[specialName].whoSees === Special.WHO_SEES.players && !isLier)) {
				Room.SPECIALS[specialName].applySpecial(player, isLier, this);
				player.acceptedSpecial = true;
				callback();
			}
		}
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
			lastTreasure: this.lastTreasure,
			specials: this.specials,
		};
	}
};
