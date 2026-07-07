function QuestionPanel({
  number = 1,
  total = 5,
  type = "Technical",
  question = "Explain the difference between REST and WebSocket communication. When would you choose one over the other?",
}) {
  return (
    <div className="rm-card rm-anim rm-anim--1">
      <div className="rm-card__head">
        <h3 className="rm-card__title">Current question</h3>
        <span className="rm-chip">{type}</span>
      </div>

      <p className="rm-question__meta">
        Question {number} of {total}
      </p>
      <p className="rm-question__text">{question}</p>
    </div>
  );
}

export default QuestionPanel;
