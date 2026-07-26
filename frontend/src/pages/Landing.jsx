import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { homeForRole } from "../utils/roleRoutes";

const FLOW = [
  "Pick your interview",
  "Join a live room",
  "Answer on camera",
  "AI scores every answer",
  "Review your dashboard",
];

function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    document.title = "PitchNode — AI Mock Interviews";
  }, []);

  return (
    <>
      <nav className="pn-nav">
        <Logo />
        {isAuthenticated ? (
          <div className="landing-nav__auth">
            <span className="pn-pill">
              <span className="pn-node" aria-hidden="true" />
              {user?.full_name?.split(" ")[0] || "Signed in"}
            </span>
            

            {(user?.role === "user") ? (
              <>
              <button
                className="pn-btn pn-btn--ghost"
                onClick={() => navigate("/history")}
              >
                My Sessions
              </button>

              <button
                className="pn-btn pn-btn--ghost"
                onClick={() => navigate("/requests")}
              >
                My Requests
              </button>
              </>
              
            ) : (
              <button
                className="pn-btn pn-btn--ghost"
                onClick={() => navigate(homeForRole(user.role))}
              >
                Dashboard
              </button>
            )}

            <button
              className="pn-btn pn-btn--ghost"
              onClick={async () => {
                await logout();
                navigate("/", { replace: true });
              }}
            >
              Sign out
            </button>

          </div>
        ) : (
          <div className="landing-nav__auth">
          
              <button
                className="pn-btn pn-btn--ghost"
                onClick={() => navigate("/login")}
                disabled = {user}
              >
                Sign in
              </button>
            <button
              className="pn-btn pn-btn--primary"
              onClick={() => navigate("/register")}
              disabled = {user}
            >
              Sign up
            </button>
          </div>
        )}
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
            onClick={() => navigate("/room?join=1")}
          >
            Join with a code
          </button>
        </div>

        <p className="landing-hero__hint">
          No installs. Runs in your browser.
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
