import {CopyIcon, CheckIcon} from "./RoomIcons.jsx";

function RoomControls({
    roomId,
    setRoomId,
    joined,
    createdRoomId,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    copyRoomLink,
    copied,
}) {
    return (
        <div className="rm-card rm-lobby-card rm-anim">
        <h2>Start or join a session</h2>
        <p className="rm-lobby-card__sub">
            Create a room and share the code, or paste a code you received.
        </p>

        <input
            className="rm-field"
            type="text"
            placeholder="Enter room code"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            aria-label="Room code"
        />

        <div className="rm-lobby-card__actions">
            <button className="rm-btn rm-btn--primary" onClick={createRoom}>
                Create room
            </button>
            <button className="rm-btn rm-btn--outline" onClick={joinRoom}>
                Join room
            </button>
        </div>

        {createdRoomId && (
            <div className="rm-alert rm-alert--ok" role="status">
                Room <code>{createdRoomId}</code> created
                <button className="rm-btn rm-btn--outline" onClick={copyRoomLink}>
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {copied ? "Copied" : "Copy link"}
                </button>
            </div>
        )}

        {error && (
            <div className="rm-alert rm-alert--err" role="alert">
                {error}
            </div>
        )}
        </div>
    );
}

export default RoomControls;