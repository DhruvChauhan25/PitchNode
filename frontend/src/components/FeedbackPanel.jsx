const METRICS = [
  { key: "communication", label: "Communication" },
  { key: "technicalAccuracy", label: "Technical accuracy" },
  { key: "confidence", label: "Confidence" },
  { key: "problemSolving", label: "Problem solving" },
];

function FeedbackPanel({ scores = null, feedback = "" }) {
  return (
    <div className="rm-card rm-anim rm-anim--3">
      <div className="rm-card__head">
        <h3 className="rm-card__title">AI feedback</h3>
      </div>

      {METRICS.map(({ key, label }) => {
        const value = scores?.[key];
        return (
          <div className="rm-metric" key={key}>
            <span className="rm-metric__label">{label}</span>
            <span className="rm-metric__value">
              {value != null ? `${value}%` : "—"}
            </span>
            <div className="rm-metric__bar">
              <div
                className="rm-metric__fill"
                style={{ width: value != null ? `${value}%` : "0%" }}
              />
            </div>
          </div>
        );
      })}

      {feedback ? (
        <p className="rm-card__note">{feedback}</p>
      ) : (
        !scores && (
          <p className="rm-card__note">
            Scores appear here after each answer is evaluated.
          </p>
        )
      )}
    </div>
  );
}

export default FeedbackPanel;
