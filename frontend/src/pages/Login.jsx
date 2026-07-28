import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { homeForRole } from "../utils/roleRoutes";
import { isMockAuth, ROLES } from "../api/authApi";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Log in — PitchNode";
  }, []);

  if (isAuthenticated) {
    const to = location.state?.from ?? (user.role === ROLES.USER ? "/" : homeForRole(user.role));
    return <Navigate to={to} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const me = await login({ email, password });
      navigate(location.state?.from ?? homeForRole(me.role), { replace: true });
    } catch (err) {
      setError(err?.message || "Could not sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <nav className="pn-nav">
        <Logo />
      </nav>

      <main className="auth-main">
        <div className="pn-card auth-card">
          <h1>Welcome back</h1>
          <p className="auth-card__sub">Sign in to continue your practice.</p>

          <form onSubmit={submit} className="auth-form">
            <label className="auth-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="pn-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <label className="auth-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="pn-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="pn-btn pn-btn--primary auth-submit"
              type="submit"
              disabled={busy}
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="auth-alt">
            New to PitchNode? <Link to="/register">Create an account</Link>
          </p>

          {isMockAuth() && (
            <p className="auth-devhint">
              Dev mode, seeded admin: <code>admin@pitchnode.dev</code> /{" "}
              <code>admin123</code>
            </p>
          )}
        </div>
      </main>
    </>
  );
}

export default Login;
