import { useRef, useEffect } from "react";

function TranscriptPanel({ lines = [], interim = "" , supported = true}) {
    const scrollRef = useRef(null);

    useEffect(() => {
        const scrollEl = scrollRef.current;
        if (scrollEl) {
            scrollEl.scrollTop = scrollEl.scrollHeight;
        }
    }, [lines, interim]);

    return (
    <div className="rm-card rm-anim rm-anim--2">
      <div className="rm-card__head">
        <h3 className="rm-card__title">Live transcript</h3>
      </div>

      <div className="rm-transcript" aria-live="polite" ref={scrollRef}>
        {!supported ? (
          <span className="rm-transcript__waiting">
            Live transcription needs Chrome or Edge. Whisper-based
            transcription arrives in next version.
          </span>
        ) : lines.length === 0 && !interim ? (
          <span className="rm-transcript__waiting">
            <span
              className="rm-dot rm-dot--pulse"
              style={{ color: "var(--rm-accent)" }}
            />
            Listening… start speaking.
          </span>
        ) : (
          <>
            {lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            {interim && <p className="rm-transcript__interim">{interim}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default TranscriptPanel;
