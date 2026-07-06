function RoomControls({
    roomId,
    setRoomId,
    joined,
    createdRoomId,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
}) {
    return (
        <div className="room-controls">
        <h5>Room Controls</h5>

            <input
                className="form-control mb-3"
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
            />
            <button
                className="btn btn-success mb-3 me-2"
                onClick={createRoom}
                >
                Create Room
            </button>

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
        </div>
    );
}

export default RoomControls;