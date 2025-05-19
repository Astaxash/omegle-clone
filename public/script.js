const socket = io("https://stranger-chat-gv7k.onrender.com");
let peer;
let localStream;

const chatBox = document.getElementById("chat");
const msgInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const reportBtn = document.getElementById("reportBtn");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const statusText = document.getElementById("status");

sendBtn.onclick = () => {
  const msg = msgInput.value.trim();
  if (msg) {
    chatBox.innerHTML += `<p><b>You:</b> ${msg}</p>`;
    socket.emit("message", msg);
    msgInput.value = "";
  }
};

disconnectBtn.onclick = () => {
  socket.emit("disconnect-chat");
  location.reload();
};

reportBtn.onclick = () => {
  socket.emit("report");
  alert("User has been reported.");
};

socket.on("waiting", () => {
  statusText.textContent = "Waiting for a partner...";
});

socket.on("partner-found", async () => {
  statusText.textContent = "Partner found! Start chatting.";

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  peer = new SimplePeer({
    initiator: location.hash === "#1",
    trickle: false,
    stream: localStream
  });

  peer.on("signal", data => {
    socket.emit("signal", data);
  });

  peer.on("stream", stream => {
    remoteVideo.srcObject = stream;
  });

  socket.on("signal", data => {
    peer.signal(data);
  });
});

socket.on("message", msg => {
  chatBox.innerHTML += `<p><b>Stranger:</b> ${msg}</p>`;
});

socket.on("partner-left", () => {
  alert("Partner left the chat.");
  location.reload();
});

socket.on("reported", () => {
  alert("You've been reported and disconnected.");
  location.reload();
});

let micEnabled = true;
let videoEnabled = true;

document.getElementById("toggle-mic").addEventListener("click", () => {
  if (!localStream) return;

  micEnabled = !micEnabled;
  localStream.getAudioTracks()[0].enabled = micEnabled;
  document.getElementById("toggle-mic").textContent = micEnabled ? "🎤 Mute Mic" : "🔇 Unmute Mic";
});

document.getElementById("toggle-video").addEventListener("click", () => {
  if (!localStream) return;

  videoEnabled = !videoEnabled;
  localStream.getVideoTracks()[0].enabled = videoEnabled;
  document.getElementById("toggle-video").textContent = videoEnabled ? "🎥 Turn Off Video" : "📷 Turn On Video";
});