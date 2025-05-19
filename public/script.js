const socket = io();
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const muteBtn = document.getElementById("muteBtn");
const videoBtn = document.getElementById("videoBtn");
const screenBtn = document.getElementById("screenBtn");

let localStream, peer;
let isAudio = true, isVideo = true;

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  localVideo.srcObject = stream;
  localStream = stream;

  socket.emit("join");

  socket.on("initiate", () => startPeer(true));
  socket.on("signal", data => peer.signal(data));
  socket.on("disconnectPeer", () => peer.destroy());
});

function startPeer(initiator) {
  peer = new SimplePeer({
    initiator,
    trickle: false,
    stream: localStream,
    config: {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    }
  });

  peer.on("signal", data => socket.emit("signal", data));

  peer.on("stream", stream => {
    remoteVideo.srcObject = stream;
  });

  peer.on("close", () => remoteVideo.srcObject = null);
}

muteBtn.onclick = () => {
  isAudio = !isAudio;
  localStream.getAudioTracks()[0].enabled = isAudio;
  muteBtn.textContent = isAudio ? "Mute" : "Unmute";
};

videoBtn.onclick = () => {
  isVideo = !isVideo;
  localStream.getVideoTracks()[0].enabled = isVideo;
  videoBtn.textContent = isVideo ? "Video Off" : "Video On";
};

screenBtn.onclick = async () => {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  const sender = peer._pc.getSenders().find(s => s.track.kind === "video");
  sender.replaceTrack(screenStream.getVideoTracks()[0]);
};