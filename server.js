const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waiting = null;

io.on("connection", socket => {
  if (waiting) {
    const partner = waiting;
    waiting = null;
    socket.emit("initiate");
    partner.emit("initiate");

    socket.on("signal", data => partner.emit("signal", data));
    partner.on("signal", data => socket.emit("signal", data));

    socket.on("disconnect", () => partner.emit("disconnectPeer"));
    partner.on("disconnect", () => socket.emit("disconnectPeer"));
  } else {
    waiting = socket;
  }
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));