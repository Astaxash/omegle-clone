const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "*", // For testing. Replace with your frontend URL in production.
    methods: ["GET", "POST"]
  }
});

app.use(express.static('public'));

let waitingUsers = [];

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  // When user is ready to find a partner
  socket.on('ready', () => {
    // If there’s someone waiting, match them
    if (waitingUsers.length > 0) {
      const randomIndex = Math.floor(Math.random() * waitingUsers.length);
      const partner = waitingUsers.splice(randomIndex, 1)[0];

      // Pair them
      socket.partner = partner;
      partner.partner = socket;

      socket.emit('initiate');
      partner.emit('initiate');
    } else {
      // No one waiting, add this user to queue
      waitingUsers.push(socket);
    }
  });

  // When a signal is received (SDP offer/answer/ICE)
  socket.on('signal', data => {
    if (socket.partner) {
      socket.partner.emit('signal', data);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove from waiting list if still waiting
    waitingUsers = waitingUsers.filter(s => s.id !== socket.id);

    // Notify partner if exists
    if (socket.partner) {
      socket.partner.emit('disconnect');
      socket.partner.partner = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
