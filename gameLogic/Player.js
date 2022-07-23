module.exports = class Player {
	static MIN_USERNAME_LENGTH = 2;
	static MAX_USERNAME_LENGTH = 14;

	constructor(username, shape, color) {
		this.username = username;
		this.shape = shape;
		this.color = color;
		this.guess = -1;
		this.score = 0;
		this.scoringFactor = 1;
		this.acceptedSpecial = false;
	}

	gameReset() {
		this.score = 0;
		this.roundReset;
	}

	roundReset() {
		this.guess = -1;
		this.scoringFactor = 1;
		this.acceptedSpecial = false;
	}
};
