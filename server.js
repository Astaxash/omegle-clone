const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

let waitingUser = null;

io.on('connection', socket => {
  console.log('A user connected:', socket.id);

  socket.on('ready', () => {
    if (waitingUser) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      waitingUser.emit('initiate');
      socket.emit('initiate');

      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on('signal', data => {
    if (socket.partner) {
      socket.partner.emit('signal', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.partner) {
      socket.partner.partner = null;
      socket.partner.emit('disconnect');
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
