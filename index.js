const express = require('express');
const app = express();
const PORT = 3000;
const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

app.use('/', express.static('public'));
app.get('/', (req, res) => {
	res.sendFile('public/index.html');
});

io.on('connection', (socket) => {
	console.log('a user connected');
});

server.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}`);
});
