module.exports = {
	getTimestamp: () => {
		return Math.floor(new Date().getTime() / 1000);
	},
};
