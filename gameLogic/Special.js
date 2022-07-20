module.exports = class Special {
	static WHO_SEES = {
		lier: 0,
		players: 1,
	};
	constructor(def, name, applyFunc, whoSees) {
		this.default = def;
		this.name = name;
		this.applySpecial = applyFunc;
		this.whoSees = whoSees;
	}
};
