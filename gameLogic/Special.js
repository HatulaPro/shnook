module.exports = class Special {
	constructor(def, name, applyFunc) {
		this.default = def;
		this.name = name;
		this.applySpecial = applyFunc;
	}
};
