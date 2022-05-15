const express = require('express');
const app = express();
const PORT = 3000;
const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

app.use('/public', express.static('public'));
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html');
});

app.get('/create', (req, res) => {
	res.sendFile(__dirname + '/views/create.html');
});

app.get('/join', (req, res) => {
	res.sendFile(__dirname + '/views/join.html');
});

io.on('connection', (socket) => {
	console.log('a user connected');
});

server.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}`);
});
