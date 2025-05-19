const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

app.use(express.static(__dirname));

let waitingSocket = null;

io.on("connection", socket => {
  if (waitingSocket) {
    socket.partner = waitingSocket;
    waitingSocket.partner = socket;

    waitingSocket.emit("ready");
    socket.emit("ready");

    waitingSocket = null;
  } else {
    waitingSocket = socket;
  }

  socket.on("offer", data => {
    if (socket.partner) socket.partner.emit("offer", data);
  });

  socket.on("answer", data => {
    if (socket.partner) socket.partner.emit("answer", data);
  });

  socket.on("chat", msg => {
    if (socket.partner) socket.partner.emit("chat", msg);
  });

  socket.on("disconnect", () => {
    if (socket.partner) socket.partner.partner = null;
    if (waitingSocket === socket) waitingSocket = null;
  });
});

http.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
