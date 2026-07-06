import {useEffect, useState, useRef} from "react";
import {io} from "socket.io-client";

import {createRoomApi, checkRoomApi} from "../api/sessionApi";
import VideoPanel from "../components/VideoPanel";
import RoomControls from "../components/RoomControls";
import SessionStats from "../components/SessionStats";
import useLocalMedia from "../hooks/useLocalMedia";
import usePeerConnection from "../hooks/usePeerConnection";

function InterviewRoom() {
    const [createdRoomId, setCreatedRoomId] = useState("");
    const [roomId, setRoomId] = useState("");
    const [participantCount, setParticipantCount] = useState(0);
    const [joined, setJoined] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [participantJoinedSignal, setParticipantJoinedSignal] = useState(0);
    const [error, setError] = useState("");

    const socketRef = useRef(null);
    if (!socketRef.current) {
        socketRef.current = io("http://localhost:5001");
    }
    const socket = socketRef.current;

    const localStream = useLocalMedia();
    const {peerConnectionRef, remoteStream} = usePeerConnection({socket, roomId, localStream});

    useEffect(() => {
        socket.on("participant-count", (count) => {
            setParticipantCount(count);
        });

        socket.off("participant-joined");
        socket.on("participant-joined", () => {
            setParticipantJoinedSignal((prev) => prev + 1);
        });

        return () => {
            socket.off("participant-count");
            socket.off("participant-joined");
        };
    }, [socket]);

    useEffect(() => {
        if (!isHost || participantJoinedSignal === 0 || !localStream) return;

        const pc = peerConnectionRef.current;
        if (!pc) return;

        let cancelled = false;

        (async () => {
            const offer = await pc.createOffer();
            if (cancelled) return;
            await pc.setLocalDescription(offer);
            socket.emit("offer", {roomId, offer});
        })();

        return () => { cancelled = true; };
    }, [isHost, participantJoinedSignal, localStream, roomId]);

    const createRoom = async () => {
        try {
            const response = await createRoomApi();
            const newRoomId = response?.data?.roomId;

            setCreatedRoomId(newRoomId);
            setRoomId(newRoomId);
            setIsHost(true);
            setJoined(true);

            socket.emit("join-session", newRoomId);
        } catch (err) {
            console.error("Error creating room:", err);
        }
    };

    const joinRoom = async () => {
        if (!roomId) {
            setError("Please enter a valid Room ID");
            return;
        }

        try {
            const response = await checkRoomApi(roomId);

            if (!response.data.exists) {
                setError("Room does not exist. Please check the Room ID.");
                return;
            }

            socket.emit("join-session", roomId);
            setJoined(true);
            setError("");
        } catch (err) {
            console.error("Error joining room:", err);
        }
    };

    const leaveRoom = () => {
        if (!roomId) {
            setError("No Room ID found. Cannot leave room.");
            return;
        }

        socket.emit("leave-session", roomId);

        setJoined(false);
        setIsHost(false);
        setCreatedRoomId("");
        setRoomId("");
        setParticipantCount(0);
    };

    return (
        <div className="container mt-5">
            <h2>Interview Room</h2>

            <h4>Local Stream</h4>
            <VideoPanel stream={localStream} muted={true} />

            <h4 className="mt-3">Remote Stream</h4>
            <VideoPanel stream={remoteStream} muted={false} />

            <div className="mt-3">
                <RoomControls
                    roomId={roomId}
                    setRoomId={setRoomId}
                    joined={joined}
                    createdRoomId={createdRoomId}
                    error={error}
                    createRoom={createRoom}
                    joinRoom={joinRoom}
                    leaveRoom={leaveRoom}
                />

                <SessionStats participantCount={participantCount} />
            </div>
        </div>
    );
}

export default InterviewRoom;
