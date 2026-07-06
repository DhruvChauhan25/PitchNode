function SessionInfo({
  participantCount = 0,
  roomId = "",
  type = "Technical",
  duration = "30 min",
  connected = false,
}) {
  const rows = [
    { key: "Participants", val: participantCount },
    { key: "Room ID", val: roomId || "—" },
    { key: "Interview type", val: type },
    { key: "Duration", val: duration },
    { key: "Connection quality", val: connected ? "Good" : "—" },
  ];

  return (
    <div className="rm-card rm-anim rm-anim--4">
      <div className="rm-card__head">
        <h3 className="rm-card__title">Session info</h3>
      </div>

      <div className="rm-info">
        {rows.map(({ key, val }) => (
          <div className="rm-info__row" key={key}>
            <span className="rm-info__key">{key}</span>
            <span className="rm-info__val">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SessionInfo;
