module.exports = class Player {
	constructor(username, shape, color) {
		this.username = username;
		this.shape = shape;
		this.color = color;
		this.guess = -1;
		this.score = 0;
		this.scoringFactor = 1;
	}

	gameReset() {
		this.score = 0;
		this.roundReset;
	}

	roundReset() {
		this.guess = -1;
		this.scoringFactor = 1;
	}
};
