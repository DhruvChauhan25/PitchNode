import {useEffect, useRef, useState} from "react";
import {registerSignalingEvents} from "../socket/signaling";
import {createPeerConnection, registerRemoteTrack, addLocalStream} from "../webrtc/peerConnection";

export default function usePeerConnection({socket, roomId, localStream}) {
    const peerConnectionRef = useRef(null);
    const roomIdRef = useRef(roomId);
    const [remoteStream, setRemoteStream] = useState(null);

    useEffect(() => {
        roomIdRef.current = roomId;
    }, [roomId]);

    useEffect(() => {
        const pc = createPeerConnection();
        peerConnectionRef.current = pc;

        registerRemoteTrack(pc, (stream) => {
            setRemoteStream(stream);
        });

        const cleanupSignaling = registerSignalingEvents(
            socket,
            peerConnectionRef,
            () => roomIdRef.current
        );

        pc.onicecandidate = (event) => {
            if (event.candidate && roomIdRef.current) {
                socket.emit("ice-candidate", {
                    roomId: roomIdRef.current,
                    candidate: event.candidate,
                });
            }
        };

        return () => {
            cleanupSignaling();
            pc.close();
            peerConnectionRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (peerConnectionRef.current && localStream) {
            addLocalStream(peerConnectionRef.current, localStream);
        }
    }, [localStream]);

    return {peerConnectionRef, remoteStream};
}
