const express = require('express');

const indexRenderer = (req, res) => {
	res.render('index');
};

const router = express.Router();

router.get('/', (req, res) => {
	res.send('home');
});

router.get('/game/:gameId', indexRenderer);

router.get('/join', indexRenderer);

router.get('/create', indexRenderer);

module.exports = router;
