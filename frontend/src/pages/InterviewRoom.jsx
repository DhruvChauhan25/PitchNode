import {useEffect, useState} from "react";
import {io} from "socket.io-client";
import axios from "axios";

import {createRoomApi, checkRoomApi} from "../api/sessionApi";

const socket = io("http://localhost:5001");

function InterviewRoom() {
    const [createdRoomId, setCreatedRoomId] = useState("");
    const [roomId, setRoomId] = useState("");
    const [messages, setMessages] = useState([]);
    const [participantCount, setParticipantCount] = useState(0);
    const [joined, setJoined] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        socket.on("message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        }); 

        socket.on("participant-count", (count) => {
            setParticipantCount(count);
        });

        return () => {
            socket.off("message");
            socket.off("participant-count");
        };
    }, []);

    const createRoom = async () => {
        try {
            const response = await createRoomApi();
            setCreatedRoomId(response.data.roomId);
            setRoomId(response.data.roomId);
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
                socket.emit("join-session", roomId);
                setError("");
                setJoined(true);
        } catch (err) {
            console.error("Error joining room:", err);
        }
    };

    const leaveRoom = () => {
        if(roomId) {
            socket.emit("leave-session", roomId);
            setParticipantCount(0);
            setJoined(false);
        }
    };

    return (
        <div className="container mt-5">
            <h2>Interview Room</h2>

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

            <hr/>

            {messages.map((msg, index) => (
                <div key={index} className="card mb-2">
                    <div className="card-body">
                        {msg}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default InterviewRoom;