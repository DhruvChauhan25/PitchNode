let peerConnection = null;

export const createPeerConnection = () => {
    peerConnection = new RTCPeerConnection({
        iceServers: [
            { 
                urls: 'stun:stun.l.google.com:19302' 
            },
        ]
    });
    peerConnection.createDataChannel("TEST");
    return peerConnection;
}

export const getPeerConnection = () => {
    return peerConnection;
}

export const closePeerConnection = () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
}