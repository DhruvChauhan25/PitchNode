import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

const FLOW = [
  "Pick your interview",
  "Join a live room",
  "Answer on camera",
  "AI scores every answer",
  "Review your dashboard",
];

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "PitchNode — AI Mock Interviews";
  }, []);

  return (
    <>
      <nav className="pn-nav">
        <Logo />
        <span className="pn-pill">
          <span className="pn-node" aria-hidden="true" />
          Live peer sessions
        </span>
      </nav>

      <main className="landing-hero">
        <span className="landing-hero__eyebrow">AI-powered mock interviews</span>

        <h1>
          Ace every interview. <em>Anywhere. Instantly.</em>
        </h1>

        <p className="landing-hero__sub">
          Practice technical, behavioral, and HR interviews over live video —
          and get structured AI feedback on every answer, the moment you finish
          speaking.
        </p>

        <div className="landing-hero__cta">
          <button
            className="pn-btn pn-btn--primary"
            onClick={() => navigate("/setup")}
          >
            Start mock interview
          </button>
          <button
            className="pn-btn pn-btn--ghost"
            onClick={() => navigate("/room")}
          >
            Join with a code
          </button>
        </div>

        <p className="landing-hero__hint">
          No installs. Runs in your browser over WebRTC.
        </p>
      </main>

      <footer className="landing-flow" aria-label="How a session works">
        {FLOW.map((step, i) => (
          <span key={step} className="landing-flow__step">
            {i > 0 && (
              <span className="landing-flow__arrow" aria-hidden="true">
                →
              </span>
            )}
            <strong>{step}</strong>
          </span>
        ))}
      </footer>
    </>
  );
}

export default Landing;
