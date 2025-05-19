const socket = io("https://stranger-chat-gv7k.onrender.com");
let localStream;
let peer;
const video = document.getElementById('localVideo');
const remote = document.getElementById('remoteVideo');
const muteBtn = document.getElementById('muteBtn');
const videoBtn = document.getElementById('videoBtn');
const screenBtn = document.getElementById('screenBtn');
const sendBtn = document.getElementById('sendBtn');
const messageInput = document.getElementById('messageInput');
const messages = document.getElementById('messages');
const notify = document.getElementById('notify');

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  localStream = stream;
  video.srcObject = stream;
  socket.emit('ready');
});

socket.on('partner-found', () => {
  peer = new SimplePeer({
    initiator: true,
    trickle: false,
    stream: localStream
  });

  peer.on('signal', data => socket.emit('signal', data));
  peer.on('stream', stream => remote.srcObject = stream);
  peer.on('data', data => {
    const msg = new TextDecoder().decode(data);
    notify.play();
    messages.innerHTML += `<div><b>Stranger:</b> ${msg}</div>`;
  });

  socket.on('signal', data => peer.signal(data));
});

socket.on('partner-left', () => {
  messages.innerHTML += "<div><i>Stranger left the chat.</i></div>";
  remote.srcObject = null;
});

sendBtn.onclick = () => {
  const msg = messageInput.value;
  if (msg && peer) {
    peer.send(msg);
    messages.innerHTML += `<div><b>You:</b> ${msg}</div>`;
    messageInput.value = '';
  }
};

muteBtn.onclick = () => {
  localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
  muteBtn.textContent = localStream.getAudioTracks()[0].enabled ? 'Mute' : 'Unmute';
};

videoBtn.onclick = () => {
  localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
  videoBtn.textContent = localStream.getVideoTracks()[0].enabled ? 'Video Off' : 'Video On';
};

screenBtn.onclick = async () => {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  peer.replaceTrack(localStream.getVideoTracks()[0], screenStream.getVideoTracks()[0], localStream);
  localStream = screenStream;
  video.srcObject = screenStream;
};
