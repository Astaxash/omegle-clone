const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // serve your front end files from /public

const waitingUsers = [];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Try to pair with waiting user or wait
  socket.on('ready', () => {
  if (waitingUsers.length > 0) {
    const partnerId = waitingUsers.shift();
    socket.partnerId = partnerId;
    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (partnerSocket) partnerSocket.partnerId = socket.id;

    socket.emit('partnerFound', partnerId);
    io.to(partnerId).emit('partnerFound', socket.id);

    socket.emit('status', 'Partner connected');
    io.to(partnerId).emit('status', 'Partner connected');
  } else {
    waitingUsers.push(socket.id);
    socket.emit('status', 'Waiting for a stranger...');
  }
});


  // Relay signaling data
  socket.on('signal', (data) => {
    if (socket.partnerId) {
      io.to(socket.partnerId).emit('signal', { from: socket.id, data: data });
    }
  });

  // Chat messages relay
  socket.on('chat', (msg) => {
    if (socket.partnerId) {
      io.to(socket.partnerId).emit('chat', msg);
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.partnerId) {
      io.to(socket.partnerId).emit('status', 'Partner disconnected');
      io.to(socket.partnerId).emit('partnerDisconnected');
      const partnerSocket = io.sockets.sockets.get(socket.partnerId);
      if (partnerSocket) partnerSocket.partnerId = null;
    } else {
      // Remove from waiting queue if still waiting
      const index = waitingUsers.indexOf(socket.id);
      if (index !== -1) waitingUsers.splice(index, 1);
    }
  });

  // Manual disconnect by user
  socket.on('disconnectPartner', () => {
    if (socket.partnerId) {
      io.to(socket.partnerId).emit('status', 'Partner disconnected');
      io.to(socket.partnerId).emit('partnerDisconnected');
      const partnerSocket = io.sockets.sockets.get(socket.partnerId);
      if (partnerSocket) partnerSocket.partnerId = null;
      socket.partnerId = null;
      socket.emit('status', 'Disconnected. Waiting for a stranger...');
      waitingUsers.push(socket.id);
    }
  });

  // Report button - just forwards event (you can add handling)
  socket.on('reportPartner', () => {
    if (socket.partnerId) {
      io.to(socket.partnerId).emit('reported');
      socket.emit('reportAcknowledged');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
