const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
  socket.on("join-room", () => {
    if (waitingUser) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.emit("init-peer", true); // This one initiates
      waitingUser.emit("init-peer", false); // This one responds

      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on("signal", (data) => {
    if (socket.partner) {
      socket.partner.emit("signal", data);
    }
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.partner = null;
      socket.partner.emit("partner-left");
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
