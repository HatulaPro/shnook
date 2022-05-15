const express = require('express');
const { nanoid } = require('nanoid');

const router = express.Router();
router.get('/game/:gameId', (req, res) => {
	res.render('index', { id: req.params['gameId'] });
});

router.get('/', (req, res) => {
	res.render('index', { id: null });
});

module.exports = router;
