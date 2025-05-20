const socket = io();
let localStream;
let peer;
let isMuted = false;
let isVideoOff = false;

// DOM elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const status = document.getElementById('status');
const chat = document.getElementById('chat');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const reportBtn = document.getElementById('reportBtn');
const muteBtn = document.getElementById('muteBtn');
const videoBtn = document.getElementById('videoBtn');

// Get local media stream
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
    socket.emit('ready');
  })
  .catch(err => {
    alert('Camera/Mic error: ' + err.message);
  });

// Signaling and Peer Setup
socket.on('initiate', () => {
  peer = createPeer(true);
});
socket.on('signal', data => {
  if (!peer) peer = createPeer(false);
  peer.signal(data);
});
socket.on('disconnect', () => {
  status.innerText = "Stranger disconnected";
  cleanupPeer();
});

// Peer setup function
function createPeer(initiator) {
  const newPeer = new SimplePeer({
    initiator,
    trickle: false,
    stream: localStream
  });

  newPeer.on('signal', data => socket.emit('signal', data));
  newPeer.on('stream', stream => {
    remoteVideo.srcObject = stream;
    status.innerText = "Stranger connected";
  });
  newPeer.on('data', handleData);
  newPeer.on('close', () => {
    status.innerText = "Connection closed";
    remoteVideo.srcObject = null;
  });

  return newPeer;
}

// Handle incoming chat messages
function handleData(data) {
  try {
    const msg = JSON.parse(data);
    if (msg.type === 'chat') {
      appendMessage(`Stranger: ${msg.message}`);
    }
  } catch (err) {
    console.error("Invalid data:", data);
  }
}

// Send message
sendBtn.onclick = () => {
  const text = messageInput.value.trim();
  if (!text || !peer) return;
  appendMessage(`You: ${text}`);
  peer.send(JSON.stringify({ type: 'chat', message: text }));
  messageInput.value = '';
};

function appendMessage(text) {
  const div = document.createElement('div');
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// Button controls
muteBtn.onclick = () => {
  if (!localStream) return;
  isMuted = !isMuted;
  localStream.getAudioTracks().forEach(t => t.enabled = !isMuted);
  muteBtn.innerHTML = isMuted ? '🎤❌' : '🎤';
};

videoBtn.onclick = () => {
  if (!localStream) return;
  isVideoOff = !isVideoOff;
  localStream.getVideoTracks().forEach(t => t.enabled = !isVideoOff);
  videoBtn.innerHTML = isVideoOff ? '📷❌' : '📷';
};

disconnectBtn.onclick = () => {
  cleanupPeer();
  socket.emit('ready');
  status.innerText = "Disconnected. Searching again...";
};

reportBtn.onclick = () => {
  alert("User reported and disconnected.");
  disconnectBtn.click();
};

// Cleanup
function cleanupPeer() {
  if (peer) {
    peer.destroy();
    peer = null;
  }
  remoteVideo.srcObject = null;
}
