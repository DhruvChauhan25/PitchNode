import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import {
  INTERVIEW_TYPES,
  DIFFICULTIES,
  DURATIONS,
} from "../data/questionBank";

const TYPE_DESCRIPTIONS = {
  Technical: "Algorithms, system design, and core CS concepts, scored on a structured rubric.",
  Behavioral: "STAR-format questions about past situations, actions, and outcomes.",
  HR: "Motivation, fit, and career questions from real screening rounds.",
};

function Segmented({ options, value, onChange, format = (v) => v, label }) {
  return (
    <div className="setup-seg" role="radiogroup" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt}
          role="radio"
          aria-checked={value === opt}
          className={`setup-seg__opt${
            value === opt ? " setup-seg__opt--active" : ""
          }`}
          onClick={() => onChange(opt)}
        >
          {format(opt)}
        </button>
      ))}
    </div>
  );
}

function InterviewSetup() {
  const navigate = useNavigate();
  const [type, setType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    document.title = "Set up your interview — PitchNode";
  }, []);

  const startInterview = () => {
    navigate("/room", { state: { settings: { type, difficulty, duration } } });
  };

  return (
    <>
      <nav className="pn-nav">
        <Logo />
        <span className="pn-pill">Step 1 of 2 · Session setup</span>
      </nav>

      <main className="setup-main">
        <header className="setup-head">
          <h1>Choose your interview</h1>
          <p>These settings decide which questions you get and how the session is scored.</p>
        </header>

        <section>
          <p className="setup-group__label">Interview type</p>
          <div className="setup-types">
            {INTERVIEW_TYPES.map((t) => (
              <button
                key={t}
                className={`setup-type${t === type ? " setup-type--active" : ""}`}
                onClick={() => setType(t)}
                aria-pressed={t === type}
              >
                <span className="setup-type__name">{t}</span>
                <span className="setup-type__desc">{TYPE_DESCRIPTIONS[t]}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="setup-group__label">Difficulty</p>
          <Segmented
            options={DIFFICULTIES}
            value={difficulty}
            onChange={setDifficulty}
            label="Difficulty"
          />
        </section>

        <section>
          <p className="setup-group__label">Duration</p>
          <Segmented
            options={DURATIONS}
            value={duration}
            onChange={setDuration}
            format={(d) => `${d} min`}
            label="Duration"
          />
        </section>

        <footer className="setup-footer">
          <p className="setup-summary">
            <strong>{type}</strong> · <strong>{difficulty}</strong> ·{" "}
            <strong>{duration} min</strong>
          </p>
          <button className="pn-btn pn-btn--primary" onClick={startInterview}>
            Start interview
          </button>
        </footer>
      </main>
    </>
  );
}

export default InterviewSetup;
