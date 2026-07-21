import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

function ExpertDashboard() {
    const {user, logout} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {

    }, [])

    return(
        <>
            <nav className="pn-nav" >
                <Logo/>
                <div className="admin-nav__right">
                    <span className="pn-pill">
                        <span className="pn-node" aria-hidden="true"/>
                        Expert . {user?.full_name}
                    </span>
                    <button
                        className="pn-btn pn-btn--ghost"
                        onClick={async () => {
                            await logout();
                            navigate("/login", {replace: true})
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </nav>

            <main className="admin-main">
                <header className="admin-head">
                    <h1>Interview Requests</h1>
                    <p>
                        Review a candidate's role and background before accepting. 
                        Acceptingcreates the interview room for both of you. 
                    </p>
                </header>

                <section className="pn-card admin-table">
                <p className="admin-empty">
                    No pending requests right now. 
                    New requests appear here as candidates submit them.
                </p>
                </section>
            </main>
        </>
    )
}

export default ExpertDashboard;
