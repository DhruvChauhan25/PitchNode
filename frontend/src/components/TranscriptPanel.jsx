function TranscriptPanel({ lines = [] }) {
  return (
    <div className="rm-card rm-anim rm-anim--2">
      <div className="rm-card__head">
        <h3 className="rm-card__title">Live transcript</h3>
      </div>

      <div className="rm-transcript" aria-live="polite">
        {lines.length === 0 ? (
          <span className="rm-transcript__waiting">
            <span className="rm-dot rm-dot--pulse" style={{ color: "var(--rm-accent)" }} />
            Waiting for speech…
          </span>
        ) : (
          lines.map((line, i) => <p key={i}>{line}</p>)
        )}
      </div>
    </div>
  );
}

export default TranscriptPanel;
