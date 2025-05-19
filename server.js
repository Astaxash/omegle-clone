const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = [];

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  let paired = false;
  for (let u of users) {
    if (!u.paired) {
      u.paired = true;
      socket.paired = true;
      socket.partner = u.socket;
      u.socket.partner = socket;

      socket.emit("partner-found");
      u.socket.emit("partner-found");
      paired = true;
      break;
    }
  }

  if (!paired) users.push({ socket, paired: false });

  socket.on("signal", (data) => {
    if (socket.partner) socket.partner.emit("signal", data);
  });

  socket.on("message", (msg) => {
    if (socket.partner) socket.partner.emit("message", msg);
  });

  socket.on("disconnect", () => {
    const index = users.findIndex(u => u.socket === socket);
    if (index !== -1) users.splice(index, 1);
    if (socket.partner) {
      socket.partner.emit("partner-left");
      socket.partner.partner = null;
    }
  });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
