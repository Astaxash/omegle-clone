const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let waiting = null;

app.use(express.static("public"));

io.on("connection", socket => {
  console.log("User connected: " + socket.id);

  if (waiting) {
    socket.partner = waiting;
    waiting.partner = socket;

    socket.emit("partner-found");
    waiting.emit("partner-found");

    waiting = null;
  } else {
    waiting = socket;
    socket.emit("waiting");
  }

  socket.on("signal", data => {
    if (socket.partner) {
      socket.partner.emit("signal", data);
    }
  });

  socket.on("message", msg => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("partner-left");
      socket.partner.partner = null;
    }
    if (waiting === socket) {
      waiting = null;
    }
  });

  socket.on("report", () => {
    if (socket.partner) {
      socket.partner.emit("reported");
    }
  });

  socket.on("disconnect-chat", () => {
    if (socket.partner) {
      socket.partner.emit("partner-left");
      socket.partner.partner = null;
    }
    socket.partner = null;
  });
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
