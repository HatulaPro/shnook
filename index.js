const express = require('express');
const app = express();
const PORT = 3000;
const http = require('http');
const server = http.createServer(app);

const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const { Server } = require('socket.io');
const io = new Server(server);

const mainRouter = require('./routes/mainRouter');

app.use('/public', express.static('public'));
app.set('view engine', 'ejs');

app.use(mainRouter);

io.on('connection', (socket) => {
	console.log('a user connected');
});

server.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}`);
});
