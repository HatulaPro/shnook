const Generals = require('./Generals');

module.exports = class Special {
	static WHO_SEES = {
		lier: 0,
		players: 1,
	};
	constructor(def, name, applyFunc, whoSees, isTimeDependent) {
		this.default = def;
		this.name = name;
		this.applyFunc = applyFunc;
		this.whoSees = whoSees;
		this.isTimeDependent = isTimeDependent;
	}

	applySpecial(player, isLier, room) {
		// Making sure only the right players can call the special
		if ((isLier && this.whoSees === Special.WHO_SEES.lier) || (!isLier && this.whoSees === Special.WHO_SEES.players)) {
			// Making sure there are at least 3 seconds left on time dependent specials
			if (this.isTimeDependent && Generals.getTimestamp() > room.startedAt + room.TIME_BETWEEN_ROUNDS + room.timePerRound - 3) return;
			this.applyFunc(player, isLier, room);
		}
	}
};
