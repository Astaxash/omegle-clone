// Replace with your actual Render backend URL
const socket = io('https://YOUR_BACKEND_URL_HERE');

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const statusDiv = document.getElementById('status');
const chatBox = document.getElementById('chat');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const muteBtn = document.getElementById('muteBtn');
const videoBtn = document.getElementById('videoBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const reportBtn = document.getElementById('reportBtn');

let localStream;
let peer;
let isMuted = false;
let videoOff = false;

// Start media and notify server when ready
async function startMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    socket.emit('ready'); // Tell server you're ready to be matched
  } catch (err) {
    alert('Could not get camera/mic permissions');
    console.error(err);
  }
}

startMedia();

function createPeer(initiator) {
  peer = new SimplePeer({
    initiator,
    trickle: false,
    stream: localStream,
    config: {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    },
  });

  peer.on('signal', data => {
    socket.emit('signal', data);
  });

  peer.on('stream', stream => {
    remoteVideo.srcObject = stream;
  });

  peer.on('error', err => {
    console.error('Peer error:', err);
  });

  peer.on('close', () => {
    console.log('Peer connection closed');
    remoteVideo.srcObject = null;
  });
}

// Partner found
socket.on('partnerFound', (partnerId) => {
  if (!peer) {
    createPeer(true);
  }
  updateStatus('Partner connected');
});

// Receive signaling data
socket.on('signal', ({ data }) => {
  if (!peer) {
    createPeer(false);
  }
  peer.signal(data);
});

// Status updates
socket.on('status', (msg) => {
  updateStatus(msg);
});

// Partner disconnected
socket.on('partnerDisconnected', () => {
  if (peer) {
    peer.destroy();
    peer = null;
  }
  updateStatus('Partner disconnected. Waiting for a stranger...');
  remoteVideo.srcObject = null;
});

// Report acknowledgments
socket.on('reportAcknowledged', () => {
  alert('You reported your partner.');
});

socket.on('reported', () => {
  alert('You have been reported by your partner.');
});

// Chat
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const msg = messageInput.value.trim();
  if (!msg) return;
  appendMessage(`You: ${msg}`, 'self');
  socket.emit('chat', msg);
  messageInput.value = '';
}

socket.on('chat', (msg) => {
  appendMessage(`Stranger: ${msg}`, 'partner');
});

function appendMessage(msg, sender) {
  const p = document.createElement('p');
  p.textContent = msg;
  p.className = sender;
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function updateStatus(msg) {
  statusDiv.textContent = `🔌 ${msg}`;
}

// Mute/unmute
muteBtn.addEventListener('click', () => {
  if (!localStream) return;
  isMuted = !isMuted;
  localStream.getAudioTracks()[0].enabled = !isMuted;

  const icon = muteBtn.querySelector('i');
  icon.classList.toggle('fa-microphone');
  icon.classList.toggle('fa-microphone-slash');
});

// Video on/off
videoBtn.addEventListener('click', () => {
  if (!localStream) return;
  videoOff = !videoOff;
  localStream.getVideoTracks()[0].enabled = !videoOff;

  const icon = videoBtn.querySelector('i');
  icon.classList.toggle('fa-video');
  icon.classList.toggle('fa-video-slash');
});

// Disconnect
disconnectBtn.addEventListener('click', () => {
  if (peer) {
    peer.destroy();
    peer = null;
  }
  socket.emit('disconnectPartner');
  updateStatus('Disconnected. Waiting for a stranger...');
  remoteVideo.srcObject = null;
});

// Report
reportBtn.addEventListener('click', () => {
  if (confirm('Report this partner?')) {
    socket.emit('reportPartner');
  }
});
