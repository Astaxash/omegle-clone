const socket = io();
let localStream, peer, isAudio = true, isVideo = true;

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    document.getElementById("localVideo").srcObject = stream;
    socket.emit("ready");
  });

socket.on("partner-found", () => {
  peer = new SimplePeer({ initiator: true, trickle: false, stream: localStream });
  peer.on("signal", data => socket.emit("signal", data));
  peer.on("stream", stream => document.getElementById("remoteVideo").srcObject = stream);
  peer.on("data", data => {
    showMessage("Stranger: " + data.toString());
    document.getElementById("notifySound").play();
  });
});

socket.on("signal", data => peer.signal(data));
socket.on("partner-left", () => alert("Partner disconnected"));

document.getElementById("sendBtn").onclick = () => {
  const msg = document.getElementById("messageInput").value;
  if (msg) {
    peer.send(msg);
    showMessage("You: " + msg);
    document.getElementById("messageInput").value = "";
  }
};

function showMessage(msg) {
  const box = document.getElementById("chatBox");
  box.innerHTML += `<div>${msg}</div>`;
  box.scrollTop = box.scrollHeight;
}

document.getElementById("muteBtn").onclick = () => {
  isAudio = !isAudio;
  localStream.getAudioTracks()[0].enabled = isAudio;
  document.getElementById("muteBtn").textContent = isAudio ? "Mute" : "Unmute";
};

document.getElementById("videoBtn").onclick = () => {
  isVideo = !isVideo;
  localStream.getVideoTracks()[0].enabled = isVideo;
  document.getElementById("videoBtn").textContent = isVideo ? "Video Off" : "Video On";
};

document.getElementById("screenBtn").onclick = async () => {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  const videoTrack = screenStream.getVideoTracks()[0];
  peer.replaceTrack(localStream.getVideoTracks()[0], videoTrack, localStream);
};

document.getElementById("disconnectBtn").onclick = () => {
  peer.destroy();
  location.reload();
};
