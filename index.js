const express = require('express');
const sslRedirect = require('heroku-ssl-redirect').default;
const app = express();
const PORT = process.env.PORT || 3000;
const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

app.use(sslRedirect());
app.use(express.json());
app.use('/public', express.static('public'));
app.set('view engine', 'ejs');

const mainRouter = require('./routes/mainRouter');
app.use(mainRouter);
require('./routes/socketsRouter')(io);

server.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}`);
});
