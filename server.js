const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // serve front end files

const waitingUsers = [];
let activeUsers = 0;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  activeUsers++;
  io.emit('activeUsers', activeUsers); // Broadcast new count

  if (waitingUsers.length > 0) {
    const partnerId = waitingUsers.shift();
    socket.partnerId = partnerId;
    io.to(partnerId).emit('partnerFound', socket.id);
    socket.emit('partnerFound', partnerId);

    io.to(partnerId).emit('status', 'Partner connected');
    socket.emit('status', 'Partner connected');
  } else {
    waitingUsers.push(socket.id);
    socket.emit('status', 'Waiting for a stranger...');
  }

  socket.on('signal', (data) => {
    if (socket.partnerId) {
      io.to(socket.partnerId).emit('signal', { from: socket.id, data: data });
    }
  });

  socket.on('chat', (msg) => {
    if (socket.partnerId) {
      io.to(socket.partnerId).emit('chat', msg);
    }
  });

  socket.on('disconnectPartner', () => {
    if (socket.partnerId) {
      io.to(socket.partnerId).emit('status', 'Partner disconnected');
      io.to(socket.partnerId).emit('partnerDisconnected');
      const partnerSocket = io.sockets.sockets.get(socket.partnerId);
      if (partnerSocket) partnerSocket.partnerId = null;
      socket.partnerId = null;
    }
    waitingUsers.push(socket.id);
    socket.emit('status', 'Disconnected. Waiting for a stranger...');
  });

  socket.on('reportPartner', () => {
    if (socket.partnerId) {
      io.to(socket.partnerId).emit('reported');
      socket.emit('reportAcknowledged');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    activeUsers--;
    io.emit('activeUsers', activeUsers);

    if (socket.partnerId) {
      io.to(socket.partnerId).emit('status', 'Partner disconnected');
      io.to(socket.partnerId).emit('partnerDisconnected');
      const partnerSocket = io.sockets.sockets.get(socket.partnerId);
      if (partnerSocket) partnerSocket.partnerId = null;
    } else {
      const index = waitingUsers.indexOf(socket.id);
      if (index !== -1) waitingUsers.splice(index, 1);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
