import {useEffect, useState, useRef} from "react";
import {io} from "socket.io-client";
import axios from "axios";

import {createRoomApi, checkRoomApi} from "../api/sessionApi";
import {createPeerConnection} from "../webrtc/peerConnection";
import {registerSignalingEvents} from "../socket/signaling";
import {getLocalStream, stopLocalStream} from "../webrtc/media";
import VideoPanel from "../components/VideoPanel";

const socket = io("http://localhost:5001");

function InterviewRoom() {
    const [createdRoomId, setCreatedRoomId] = useState("");
    const [roomId, setRoomId] = useState("");
    const [participantCount, setParticipantCount] = useState(0);
    const [joined, setJoined] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [error, setError] = useState("");

    const peerConnectionRef = useRef(null);
    const localVideoRef = useRef(null);

    useEffect(() => {
        const pc = createPeerConnection();

        pc.onicecandidate = (event) => {
            if (event.candidate && roomId) {

                console.log("Sending ICE candidate: ", event.candidate);
                socket.emit("ice-candidate", {
                    roomId,
                    candidate: event.candidate,
                });
            }
        }
        peerConnectionRef.current = pc;

        registerSignalingEvents(
            socket,
            peerConnectionRef,
            () => roomId
        );

        socket.on("participant-count", (count) => {
            setParticipantCount(count);
        });

        socket.off("participant-joined");
        socket.on("participant-joined", async () => {

            if (!isHost) 
                return;

            console.log("Participant joined rooom");

            const offer = await peerConnectionRef.current.createOffer();

            await peerConnectionRef.current.setLocalDescription(offer);

            socket.emit("offer", {
                roomId,
                offer,
            });

            console.log("Host created offer");
        });

        return () => {
            socket.off("participant-count");
            socket.off("participant-joined");
        };
    }, [isHost, roomId]);

    useEffect(() => {
        const startMedia = async () => {
            const stream = await getLocalStream();
            setLocalStream(stream);
        };

        startMedia();

    }, []);


    const createRoom = async () => {
        try {
            const response = await createRoomApi();

            setCreatedRoomId(response.data.roomId);
            setRoomId(response.data.roomId);
            setIsHost(true);

            console.log("I am host");

        } catch (err) {
            console.error("Error creating room:", err);
        }
    };

    const joinRoom = async () => {

        if(!roomId) {
            setError("Please enter a valid Room ID");
            return;
        }
  
        try{
            const response = await checkRoomApi(roomId);

                if(!response.data.exists) {
                    setError("Room does not exist. Please check the Room ID.");
                    return;
                }

                peerConnectionRef.current.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit("ice-candidate", {
                            roomId,
                            candidate: event.candidate,
                        });
                    }
                };
      
                socket.emit("join-session", roomId);
                    
                setJoined(true);
                setError("");


                console.log("I am participant");

        } catch (err) {
            console.error("Error joining room:", err);
        }
    };

    const leaveRoom = () => {

        if(!roomId) {
            setError("No Room ID found. Cannot leave room.");
            return;
        }

        socket.emit("leave-session", roomId);

        setJoined(false);
        setParticipantCount(0);

        console.log("I left the room");

    };  

    return (
        <div className="container mt-5">
            <h2>Interview Room</h2>

            <VideoPanel stream={localStream} />

            <input
                className="form-control mb-3"
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
            />
{
            <button
                className="btn btn-success mb-3 me-2"
                onClick={createRoom}
                >
                Create Room
            </button>
}
            {!joined ? (
                <button
                    className="btn btn-primary mb-3 me-2"
                    onClick={joinRoom}
                >
                    Join Room
                </button>
                ) : (
                <button
                    className="btn btn-danger mb-3 me-2"
                    onClick={leaveRoom}
                >
                    Leave Room
                </button>
            )}

            {createdRoomId && (
                <div className="alert alert-success">
                    Room Created: {createdRoomId}
                </div>
            )}

            {roomId && !createdRoomId && (
                <div className="alert alert-info">
                    Attempting to join Room: {roomId}
                </div>
            )}

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            <div className="card mt-3">
                <div className="card-body text-center">
                    <h5>Session Statistics</h5>
                    <h3>{participantCount}</h3>
                    <p>Participants Connected</p>
                </div>
            </div>
        </div>
    );
}

export default InterviewRoom;