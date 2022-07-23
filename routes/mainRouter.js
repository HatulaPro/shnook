const express = require('express');

const Player = require('../gameLogic/Player');
const Room = require('../gameLogic/Room');

const indexRenderer = (req, res) => {
	res.render('index');
};

const router = express.Router();

router.get('/', (req, res) => {
	res.redirect('/join');
});

router.get('/game/:gameId', indexRenderer);

router.get('/join', indexRenderer);

router.get('/create', indexRenderer);

router.get('/constants', (req, res) => {
	return res.json({
		MAX_USERNAME_LENGTH: Player.MAX_USERNAME_LENGTH,
		MIN_USERNAME_LENGTH: Player.MIN_USERNAME_LENGTH,
		TIME_BETWEEN_ROUNDS: Room.TIME_BETWEEN_ROUNDS,
		MIN_TIME_PER_ROUND: Room.MIN_TIME_PER_ROUND,
		MAX_TIME_PER_ROUND: Room.MAX_TIME_PER_ROUND,
		MIN_ROUNDS: Room.MIN_ROUNDS,
		MAX_ROUNDS: Room.MAX_ROUNDS,
		MIN_PLAYERS: Room.MIN_PLAYERS,
		MAX_PLAYERS: Room.MAX_PLAYERS,
		NUMBER_OF_SHAPES: Room.NUMBER_OF_SHAPES,
		NUMBER_OF_COLORS: Room.NUMBER_OF_COLORS,
		NUMBER_OF_CHALLENGES: Room.NUMBER_OF_CHALLENGES,
		CHANCE_OF_CHALLENGE: Room.CHANCE_OF_CHALLENGE,
		CHANCE_OF_SPECIAL: Room.CHANCE_OF_SPECIAL,
	});
});

module.exports = router;
