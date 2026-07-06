export const createPeerConnection = () => {
    return new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
        ],
    });
};

export const addLocalStream = (pc, stream) => {
    if (!pc || !stream) return;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
};

export const registerRemoteTrack = (pc, callback) => {
    if (!pc) return;
    pc.ontrack = (event) => {
        callback(event.streams[0]);
    };
};
