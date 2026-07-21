import Logo from "../components/Logo";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeForRole } from "../utils/roleRoutes";
import { ROLES } from "../api/authApi";

const SIGNUP_ROLES = [
  {
    id: ROLES.USER,
    name: "Practice candidate",
    desc: "Run AI interviews, request sessions with experts, and track your progress.",
  },
  {
    id: ROLES.EXPERT_APPLICANT,
    name: "Interview expert",
    desc: "Conduct interviews and evaluate candidates. Requires admin approval before you can review requests.",
  },
];

function Register() {
    const navigate = useNavigate();
    const {register, user, isAuthenticated} = useAuth();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState(ROLES.USER);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        document.title = "Create account — PitchNode";
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        
        if(password.length < 8) {
            setError("Password must be at least 8 characters long.");
            setBusy(false);
            return;
        }
        setBusy(true);
        try{
            const me = await register({
                email,
                password,
                full_name: fullName,
                role,
            });
            navigate(homeForRole(me.role), {replace: true});
        } catch (err) {
            setError(err?.message || "Could not create your account.");
        } finally {
            setBusy(false);
        }
    }

    return (
    <>
      <nav className="pn-nav">
        <Logo />
      </nav>

      <main className="auth-main">
        <div className="pn-card auth-card auth-card--wide">
            <h1> Register Your Account </h1>
            <p className="auth-card__sub">
              Every session is saved in your account.
            </p>

            <form onSubmit={submit} className="auth-form">
                <p className="auth-label">I'm joining as</p>
                <div className="auth-roles">
                    {SIGNUP_ROLES.map((r) => (
                        <button
                            type="button"
                            key={r.id}
                            className={`auth-role${role === r.id ? " auth-role--active" : ""}`}
                            onClick={() => setRole(r.id)}
                            aria-pressed={role === r.id}
                        >
                        <span className="auth-role__name">{r.name}</span>
                        <span className="auth-role__desc">{r.desc}</span>
                        </button>
                    ))}
                </div>

                <label className="auth-label" htmlFor="fullName">
                    Full name
                </label>
                <input
                    type="text"
                    id="fullName"
                    className="pn-input"
                    name="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                />

                <label className="auth-label" htmlFor="email">
                    Email address
                </label>
                <input
                    type="email"
                    id="email"
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
                    type="password"
                    id="password"
                    className="pn-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                />

                {error && <p className="auth-error" role="alert">{error}</p>}

                <button
                    type="submit"
                    className="pn-btn pn-btn--primary auth-submit"
                    disabled={busy}
                >
                    {busy ? "Creating account..." : "Create account"}
                </button>
            </form>

            <p className="auth-card__sub">
                Already have an account?{" "}
                <Link to="/login" className="auth-link">
                    Log in
                </Link>
            </p>

            
        </div>
      </main>
    </>
  );
}

export default Register;