import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

const METRIC_LABELS = {
  communication: "Communication",
  technicalAccuracy: "Technical accuracy",
  confidence: "Confidence",
  problemSolving: "Problem solving",
};

const RECOMMENDATIONS = {
  communication:
    "Practice answering aloud with the STAR structure — situation, task, action, result — and record yourself once a week.",
  technicalAccuracy:
    "Review the core concepts behind the questions you missed and practice explaining each with a concrete example.",
  confidence:
    "Slow your pace and pause instead of using filler words. Confidence scores rise fast with deliberate delivery.",
  problemSolving:
    "Narrate your reasoning before giving the answer — interviewers score the path, not just the destination.",
};

function metricAverages(answers) {
  const keys = Object.keys(METRIC_LABELS);
  const sums = Object.fromEntries(keys.map((k) => [k, 0]));
  answers.forEach((a) => keys.forEach((k) => (sums[k] += a.scores[k])));
  return Object.fromEntries(
    keys.map((k) => [k, Math.round(sums[k] / answers.length)])
  );
}

function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Interview results — PitchNode";
  }, []);

  /* Deep-linking /results without a session goes back to setup */
  useEffect(() => {
    if (!state?.answers?.length) navigate("/setup", { replace: true });
  }, [state, navigate]);

  if (!state?.answers?.length) return null;

  const { answers, settings, totalSeconds = 0 } = state;
  const averages = metricAverages(answers);
  const ranked = Object.entries(averages).sort((a, b) => b[1] - a[1]);
  const overall = Math.round(
    ranked.reduce((sum, [, v]) => sum + v, 0) / ranked.length
  );
  const strengths = ranked.slice(0, 2).map(([k]) => METRIC_LABELS[k]);
  const weakestKey = ranked[ranked.length - 1][0];
  const weaknesses = [METRIC_LABELS[weakestKey]];
  const minutes = Math.max(1, Math.round(totalSeconds / 60));

  return (
    <>
      <nav className="pn-nav">
        <Logo />
        <span className="pn-pill">
          <span className="pn-node" aria-hidden="true" />
          Interview completed
        </span>
      </nav>

      <main className="dash-main">
        <header className="dash-head">
          <h1>Your results</h1>
          <p>
            {settings.type} · {settings.difficulty} · {answers.length}{" "}
            question{answers.length === 1 ? "" : "s"} answered in {minutes} min
          </p>
        </header>

        <section className="dash-grid">
          <div className="pn-card dash-card dash-card--score">
            <p className="dash-label">Overall score</p>
            <p className="dash-score">{overall}%</p>
            <div className="dash-metricbar">
              <div
                className="dash-metricbar__fill"
                style={{ width: `${overall}%` }}
              />
            </div>
          </div>

          <div className="pn-card dash-card">
            <p className="dash-label">Strengths</p>
            <div className="dash-chips">
              {strengths.map((s) => (
                <span key={s} className="dash-chip dash-chip--good">
                  {s}
                </span>
              ))}
            </div>
            <p className="dash-label" style={{ marginTop: 16 }}>
              Focus area
            </p>
            <div className="dash-chips">
              {weaknesses.map((w) => (
                <span key={w} className="dash-chip dash-chip--warn">
                  {w}
                </span>
              ))}
            </div>
          </div>

          <div className="pn-card dash-card">
            <p className="dash-label">Recommendation</p>
            <p className="dash-reco">{RECOMMENDATIONS[weakestKey]}</p>
          </div>
        </section>

        <section className="dash-questions">
          <h2>Question breakdown</h2>
          {answers.map((a) => (
            <div key={a.index} className="pn-card dash-card dash-q">
              <p className="dash-q__text">
                <span className="dash-q__num">Q{a.index + 1}</span>
                {a.question}
              </p>
              <div className="dash-q__metrics">
                {Object.entries(a.scores).map(([k, v]) => (
                  <div key={k} className="dash-q__metric">
                    <span>{METRIC_LABELS[k]}</span>
                    <span className="dash-q__value">{v}%</span>
                    <div className="dash-metricbar">
                      <div
                        className="dash-metricbar__fill"
                        style={{ width: `${v}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="dash-q__feedback">{a.feedback}</p>
            </div>
          ))}
        </section>

        <footer className="dash-actions">
          <button
            className="pn-btn pn-btn--primary"
            onClick={() => navigate("/setup")}
          >
            Practice again
          </button>
          <button className="pn-btn pn-btn--ghost" onClick={() => navigate("/")}>
            Back to home
          </button>
        </footer>
      </main>
    </>
  );
}

export default Results;
