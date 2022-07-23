const express = require('express');

const Player = require('../gameLogic/Player');

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
	});
});

module.exports = router;
