const socket = io("https://stranger-chat-gv7k.onrender.com");
let localStream;
let remoteStream;
let peer;
let isAudio = true;
let isVideo = true;

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

async function initMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
}

socket.on("connect", () => {
  socket.emit("join-room");
});

socket.on("init-peer", (initiator) => {
  peer = new SimplePeer({
    initiator,
    trickle: false,
    stream: localStream
  });

  peer.on("signal", (data) => {
    socket.emit("signal", data);
  });

  peer.on("stream", (stream) => {
    remoteVideo.srcObject = stream;
  });

  peer.on("error", (err) => console.error("Peer error:", err));
});

socket.on("signal", (data) => {
  peer.signal(data);
});

// Chat handling
const chatInput = document.getElementById("chatInput");
const chatBox = document.getElementById("chatBox");

document.getElementById("sendBtn").onclick = () => {
  const message = chatInput.value;
  if (message.trim() !== "") {
    peer.send(message);
    addMessage("You", message);
    chatInput.value = "";
  }
};

peer?.on?.("data", (data) => {
  addMessage("Stranger", data.toString());
});

function addMessage(sender, message) {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  new Audio("notification.mp3").play(); // Add this file
}

// Buttons
document.getElementById("toggleMic").onclick = () => {
  isAudio = !isAudio;
  localStream.getAudioTracks()[0].enabled = isAudio;
  document.getElementById("toggleMic").innerText = isAudio ? "Mute" : "Unmute";
};

document.getElementById("toggleVideo").onclick = () => {
  isVideo = !isVideo;
  localStream.getVideoTracks()[0].enabled = isVideo;
  document.getElementById("toggleVideo").innerText = isVideo ? "Video Off" : "Video On";
};

document.getElementById("shareScreen").onclick = async () => {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  peer.replaceTrack(localStream.getVideoTracks()[0], screenStream.getVideoTracks()[0], localStream);
  localVideo.srcObject = screenStream;
};
