const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let waitingUser = null;

io.on('connection', socket => {
  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;
    waitingUser.emit('partner-found');
    socket.emit('partner-found');
    waitingUser = null;
  } else {
    waitingUser = socket;
  }

  socket.on('signal', data => {
    if (socket.partner) socket.partner.emit('signal', data);
  });

  socket.on('message', msg => {
    if (socket.partner) socket.partner.emit('message', msg);
  });

  socket.on('disconnect', () => {
    if (socket.partner) {
      socket.partner.emit('partner-left');
      socket.partner.partner = null;
    }
    if (waitingUser === socket) waitingUser = null;
  });
});

http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
