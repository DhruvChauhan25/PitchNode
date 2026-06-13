import {useEffect, useState} from "react";
import {io} from "socket.io-client";

const socket = io("http://localhost:5001");

function InterviewRoom() {
    const [roomId, setRoomId] = useState("");
    const [messages, setMessages] = useState([]);
    const [participantCount, setParticipantCount] = useState(0);

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

    const joinRoom = () => {
        if (roomId) {
            socket.emit("join-session", roomId);
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
            <button 
                className="btn btn-primary mb-3" 
                onClick={joinRoom}
            >
                Join Room
            </button>

            <div className="card mt-3">
                <div className="card-body text-center">
                    <h5>Session Statistics</h5>
                    <h3>{participantCount}</h3>
                    <p>Participants Connected</p>
                </div>
            </div>

            <hr/>

            <h4>Messages:</h4>


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