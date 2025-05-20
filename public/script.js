const socket = io("https://stranger-chat-gv7k.onrender.com"); 
let localStream;
let peer;

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

let isMuted = false;
let isVideoOff = false;

// Get media and connect to socket
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
    socket.emit('ready');
  })
  .catch(err => {
    alert('Error accessing camera or mic: ' + err);
  });

// Create peer and connect
socket.on('initiate', () => {
  peer = new SimplePeer({
    initiator: true,
    trickle: false,
    stream: localStream
  });

  setupPeerEvents(peer);
});

socket.on('signal', data => {
  if (!peer) {
    peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: localStream
    });
    setupPeerEvents(peer);
  }
  peer.signal(data);
});

socket.on('disconnect', () => {
  status.innerText = "Stranger disconnected";
  if (peer) {
    peer.destroy();
    peer = null;
  }
  remoteVideo.srcObject = null;
});

// Peer event handlers
function setupPeerEvents(p) {
  p.on('signal', data => {
    socket.emit('signal', data);
  });

  p.on('stream', stream => {
    remoteVideo.srcObject = stream;
    status.innerText = "Stranger connected";
  });

  p.on('close', () => {
    status.innerText = "Connection closed";
    remoteVideo.srcObject = null;
    peer = null;
  });
}

// Send message
sendBtn.onclick = () => {
  const message = messageInput.value.trim();
  if (message && peer) {
    appendMessage(`You: ${message}`);
    peer.send(JSON.stringify({ type: 'chat', message }));
    messageInput.value = '';
  }
};

// Receive messages
if (!SimplePeer.WEBRTC_SUPPORT) {
  alert("Your browser does not support WebRTC");
}

function appendMessage(msg) {
  const div = document.createElement('div');
  div.textContent = msg;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

if (peer) {
  peer.on('data', data => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'chat') {
        appendMessage(`Stranger: ${parsed.message}`);
      }
    } catch (e) {
      console.error('Invalid data received:', data);
    }
  });
}

// Controls
muteBtn.onclick = () => {
  isMuted = !isMuted;
  localStream.getAudioTracks()[0].enabled = !isMuted;
  muteBtn.innerHTML = isMuted ? '🎙️❌' : '🎙️';
};

videoBtn.onclick = () => {
  isVideoOff = !isVideoOff;
  localStream.getVideoTracks()[0].enabled = !isVideoOff;
  videoBtn.innerHTML = isVideoOff ? '📷❌' : '📷';
};

disconnectBtn.onclick = () => {
  if (peer) {
    peer.destroy();
    peer = null;
    socket.emit('ready'); // Rejoin queue
    status.innerText = "Disconnected. Searching again...";
    remoteVideo.srcObject = null;
  }
};

reportBtn.onclick = () => {
  alert('Reported user. Disconnecting...');
  disconnectBtn.click(); // Simulate disconnect
};
