function RoomControls({
    variant, // "creating" | "join-link" | "manual-join" | "error"
    participantCount = 0,
    error,
    roomId,
    setRoomId,
    joinRoom,
    goHome,
}) {
    if (variant === "creating") {
        return (
            <div className="rm-card rm-lobby-card rm-anim">
                <h2>Setting up your room...</h2>
                <p className="rm-lobby-card__sub">This only takes a second.</p>
                {error && (
                    <div className="rm-alert rm-alert--err" role="alert">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    if (variant === "error") {
        return (
            <div className="rm-card rm-lobby-card rm-anim">
                <h2>Can't join this room</h2>
                <div className="rm-alert rm-alert--err" role="alert">
                    {error}
                </div>
                <div className="rm-lobby-card__actions">
                    <button className="rm-btn rm-btn--outline" onClick={goHome}>
                        Go home
                    </button>
                </div>
            </div>
        );
    }

    if (variant === "manual-join") {
        return (
            <div className="rm-card rm-lobby-card rm-anim">
                <h2>Join with a code</h2>
                <p className="rm-lobby-card__sub">
                    Enter the room code your host shared with you.
                </p>

                <input
                    className="rm-field"
                    type="text"
                    placeholder="Enter room code"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    aria-label="Room code"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === "Enter") joinRoom();
                    }}
                />

                <div className="rm-lobby-card__actions">
                    <button className="rm-btn rm-btn--primary" onClick={joinRoom}>
                        Join room
                    </button>
                    <button className="rm-btn rm-btn--outline" onClick={goHome}>
                        Go home
                    </button>
                </div>

                {error && (
                    <div className="rm-alert rm-alert--err" role="alert">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    // join-link — someone opened a shared room link
    return (
        <div className="rm-card rm-lobby-card rm-anim">
            <h2>Join this interview</h2>
            <p className="rm-lobby-card__sub">
                {participantCount > 0
                    ? `${participantCount} participant${participantCount === 1 ? "" : "s"} already here.`
                    : "You're the first one here — the host hasn't joined yet."}
            </p>

            <div className="rm-lobby-card__actions">
                <button className="rm-btn rm-btn--primary" onClick={joinRoom}>
                    Join room
                </button>
                <button className="rm-btn rm-btn--outline" onClick={goHome}>
                    Go home
                </button>
            </div>

            {error && (
                <div className="rm-alert rm-alert--err" role="alert">
                    {error}
                </div>
            )}
        </div>
    );
}

export default RoomControls;
