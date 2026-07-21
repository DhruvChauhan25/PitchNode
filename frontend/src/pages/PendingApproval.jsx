import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";

function PendingApproval(){
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Approval pending — PitchNode";
    }, []);

    return(
        <>
            <nav className="pn-nav">
                <Logo/>
                <button
                    className="pn-btn pn-btn--ghost"
                    onClick={async () => {
                        await logout();
                        navigate("/login", { replace: true });
                    }}
                >
                    Sign out
                </button>
            </nav>

            <main className="auth-main">
                <div className="pn-card auth-card">
                <span className="auth-badge auth-badge--warn">Approval pending</span>
                <h1>Thanks, {user?.full_name?.split(" ")[0] || "there"}</h1>
                <p className="auth-card__sub">
                    Your expert application is with our team. 
                    Because experts review candidates' resumes and job descriptions, 
                    every account is verified before it's approved.
                </p>
                <p className="auth-note">
                    You'll get access to the expert dashboard as soon as you're approved.
                    In the meantime, you can practice with the AI interviewer.
                </p>
                <button
                    className="pn-btn pn-btn--primary auth-submit"
                    onClick={() => navigate("/setup")}
                >
                    Try a practice interview
                </button>
                </div>
            </main>
        
        </>
    )

}

export default PendingApproval