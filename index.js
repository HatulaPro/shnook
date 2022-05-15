const express = require('express');
const app = express();
const PORT = 3000;
const http = require('http');
const server = http.createServer(app);

const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://shnook-ccd58-default-rtdb.europe-west1.firebasedatabase.app/',
});

const { Server } = require('socket.io');
const io = new Server(server);

app.use(express.json());
app.use('/public', express.static('public'));
app.set('view engine', 'ejs');

const mainRouter = require('./routes/mainRouter');
app.use(mainRouter);
require('./routes/socketsRouter')(io);

server.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}`);
});
