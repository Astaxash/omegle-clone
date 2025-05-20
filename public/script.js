const socket = io();
let localStream;
let peer;
let isInitiator = false;

// Get media
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    document.getElementById('localVideo').srcObject = stream;

    socket.emit('ready');

    socket.on('initiate', () => {
      isInitiator = true;
      startPeer();
    });

    socket.on('signal', data => {
      if (peer) {
        peer.signal(data);
      }
    });
  })
  .catch(err => {
    console.error('Media error:', err);
    alert('Could not access camera/mic. Please allow permissions.');
  });

function startPeer() {
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
    document.getElementById('remoteVideo').srcObject = stream;
    document.getElementById('status').innerText = "Stranger connected";
  });

  peer.on('close', () => {
    document.getElementById('status').innerText = "Stranger disconnected";
  });

  peer.on('error', err => console.error('Peer error:', err));
}

// Chat send
document.getElementById('sendBtn').onclick = () => {
  const msg = document.getElementById('messageInput').value;
  if (msg && peer) {
    peer.send(msg);
    appendChat('You', msg);
    document.getElementById('messageInput').value = '';
  }
};

// Chat receive
if (!peer) return;
peer.on('data', data => {
  appendChat('Stranger', data.toString());
});

function appendChat(sender, message) {
  const chatBox = document.getElementById('chat');
  chatBox.innerHTML += `<p><strong>${sender}:</strong> ${message}</p>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Mic toggle
document.getElementById('micBtn').onclick = () => {
  const enabled = localStream.getAudioTracks()[0].enabled;
  localStream.getAudioTracks()[0].enabled = !enabled;
  document.getElementById('micBtn').innerHTML = enabled ? '🎤🔇' : '🎤';
};

// Video toggle
document.getElementById('videoBtn').onclick = () => {
  const enabled = localStream.getVideoTracks()[0].enabled;
  localStream.getVideoTracks()[0].enabled = !enabled;
  document.getElementById('videoBtn').innerHTML = enabled ? '📷🚫' : '📷';
};

// Disconnect
document.getElementById('disconnectBtn').onclick = () => {
  if (peer) {
    peer.destroy();
    peer = null;
    document.getElementById('status').innerText = "Disconnected";
  }
};
