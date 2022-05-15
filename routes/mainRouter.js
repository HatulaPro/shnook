const express = require('express');

const functions = require('firebase-functions');
const admin = require('firebase-admin');
// admin.initializeApp();

const router = express.Router();
router.get('/', (req, res) => {
	res.render('index');
});

router.get('/create', (req, res) => {
	res.render('create');
});

router.get('/join', (req, res) => {
	res.render('join');
});

router.post('/create', async (req, res) => {
	const r = await admin.firestore().collection('rooms').add({ test: true });
	console.log(r);
	res.json({
		success: true,
	});
});

module.exports = router;
