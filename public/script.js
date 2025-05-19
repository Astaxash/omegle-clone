const socket = io("https://stranger-chat-gv7k.onrender.com");
let peer;
let localStream;
let isMuted = false;
let isVideoOn = true;

const myVideo = document.getElementById('myVideo');
const partnerVideo = document.getElementById('partnerVideo');
const muteBtn = document.getElementById('muteBtn');
const videoBtn = document.getElementById('videoBtn');
const shareScreenBtn = document.getElementById('shareScreenBtn');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const messages = document.getElementById('messages');
const notificationSound = document.getElementById('notificationSound');

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  localStream = stream;
  myVideo.srcObject = stream;

  socket.emit("ready");

  socket.on("offer", (data) => {
    peer = new SimplePeer({ initiator: false, trickle: false, stream: localStream });
    peer.signal(data);
    peer.on("signal", signal => socket.emit("answer", signal));
    peer.on("stream", stream => partnerVideo.srcObject = stream);
  });

  socket.on("answer", signal => peer.signal(signal));

  socket.on("ready", () => {
    peer = new SimplePeer({ initiator: true, trickle: false, stream: localStream });
    peer.on("signal", signal => socket.emit("offer", signal));
    peer.on("stream", stream => partnerVideo.srcObject = stream);
  });

}).catch(err => alert("Camera/Mic access denied!"));

muteBtn.onclick = () => {
  isMuted = !isMuted;
  localStream.getAudioTracks()[0].enabled = !isMuted;
  muteBtn.textContent = isMuted ? "Unmute" : "Mute";
};

videoBtn.onclick = () => {
  isVideoOn = !isVideoOn;
  localStream.getVideoTracks()[0].enabled = isVideoOn;
  videoBtn.textContent = isVideoOn ? "Video Off" : "Video On";
};

shareScreenBtn.onclick = async () => {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const videoTrack = screenStream.getVideoTracks()[0];
    const sender = peer.streams[0].getVideoTracks()[0];
    peer.replaceTrack(sender, videoTrack, localStream);

    videoTrack.onended = () => {
      peer.replaceTrack(videoTrack, sender, localStream);
    };
  } catch (err) {
    alert("Failed to share screen.");
  }
};

sendBtn.onclick = () => {
  const message = chatInput.value.trim();
  if (!message) return;

  socket.emit("chat", message);
  appendMessage("You", message);
  chatInput.value = "";
};

socket.on("chat", msg => {
  notificationSound.play();
  appendMessage("Stranger", msg);
});

function appendMessage(sender, msg) {
  const p = document.createElement("p");
  p.innerHTML = `<strong>${sender}:</strong> ${msg}`;
  messages.appendChild(p);
  messages.scrollTop = messages.scrollHeight;
}
