const socket = io("https://stranger-chat-gv7k.onrender.com");
let localStream;
let peer;
let isInitiator = false;

// Step 1: Get camera & mic
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;

    const localVideo = document.getElementById('localVideo');
    localVideo.srcObject = stream;

    socket.emit('ready');

    socket.on('initiate', () => {
      isInitiator = true;
      initPeer();
    });

    socket.on('signal', data => {
      if (peer) peer.signal(data);
    });
  })
  .catch(err => {
    console.error('Media error:', err);
    alert("Please allow camera and microphone access.");
  });

// Step 2: Peer setup
function initPeer() {
  peer = new SimplePeer({
    initiator: isInitiator,
    trickle: false,
    stream: localStream,
    config: {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }
  });

  peer.on('signal', data => {
    socket.emit('signal', data);
  });

  peer.on('stream', stream => {
    const remoteVideo = document.getElementById('remoteVideo');
    remoteVideo.srcObject = stream;
    document.getElementById('status').innerText = 'Partner connected';
  });

  peer.on('error', err => {
    console.error('Peer error:', err);
  });

  peer.on('close', () => {
    document.getElementById('status').innerText = 'Partner disconnected';
  });
}

// Step 3: Chat
const chatBox = document.getElementById('chat');
const msgInput = document.getElementById('messageInput');

document.getElementById('sendBtn').onclick = () => {
  const msg = msgInput.value;
  if (msg && peer) {
    peer.send(msg);
    appendChat('You', msg);
    msgInput.value = '';
  }
};

function appendChat(sender, text) {
  const msg = document.createElement('p');
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Receive chat
function bindPeerData() {
  if (!peer) return;
  peer.on('data', data => {
    appendChat('Stranger', data.toString());
  });
}
setInterval(bindPeerData, 1000); // Ensure it binds after peer created

// Step 4: Controls
const micBtn = document.getElementById('micBtn');
const videoBtn = document.getElementById('videoBtn');

micBtn.onclick = () => {
  const track = localStream.getAudioTracks()[0];
  track.enabled = !track.enabled;
  micBtn.innerHTML = track.enabled ? '🎤' : '🎤❌';
};

videoBtn.onclick = () => {
  const track = localStream.getVideoTracks()[0];
  track.enabled = !track.enabled;
  videoBtn.innerHTML = track.enabled ? '📷' : '📷❌';
};

document.getElementById('disconnectBtn').onclick = () => {
  if (peer) {
    peer.destroy();
    peer = null;
    document.getElementById('status').innerText = 'Disconnected';
  }
};
