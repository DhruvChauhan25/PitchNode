import { useCallback, useState, useEffect } from "react";
import { getHistoryApi } from "../api/interviewApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../components/Logo";

const STATUS = {
    created: { 
        label: "Not started", 
        cls: "req-status--pending" 
    },
    in_progress: { 
        label: "In progress", 
        cls: "req-status--accepted" 
    },
    completed: { 
        label: "Completed", 
        cls: "req-status--done" 
    },
};

const MODE_LABEL = {
  ai: "AI Interviewer",
  human: "With a Human",
  friend: "With a Friend",
};

const fmtDate = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
};

const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function SessionHistory() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sessions, setSessions] = useState([]); 
    

    const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getHistoryApi();
      setSessions(res.data?.sessions || []);
    } catch (err) {
      console.error("Failed to load session history", err);
      setError("Couldn't load your sessions. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, []);

    useEffect(() => {
        document.title = "My sessions — PitchNode";
        load();
    }, [load]);


    return(<>
        <nav className="pn-nav">
            <Logo/>
            <button 
                className="pn-btn pn-btn--primary" 
                onClick={() => navigate("/setup")}
            >
                New Interview
            </button>
        </nav>

        <main className="admin-main">
            <header className="admin-head">
                <h1>MY SESSIONS</h1>
                <p>Every Interview you've run, here</p>
            </header>

            {loading ? (
                <div className="pn-card admin-table">
                    <p className="admin-empty">Loading your sessions...</p>
                </div>
            ): error ? (
                <div className="pn-card admin-table">
                    <p className="admin-empty">
                    {error}
                    <br />
                    <button 
                        className="pn-btn pn-btn--outline req-empty-cta" 
                        onClick={load}
                    >
                        Retry
                    </button>
                    </p>
                </div>
            ) : sessions.length === 0 ? (
               <div className="pn-card admin-table">
                    <p className="admin-empty">
                        No interviews yet — start one.
                        <br />
                        <button
                            className="pn-btn pn-btn--primary req-empty-cta"
                            onClick={() => navigate("/setup")}
                        >
                            Start your first interview
                        </button>
                    </p>
                </div> 
            ) : (
                <section className="req-list">
                    {sessions.map((s) => {
                        const status = STATUS[s.status] || STATUS.created;
                        const canView = s.status === "completed";

                        return (
                            <article
                                className={`pn-card req-item${canView ? " session-item--clickable" : ""}`}
                                key={s.id}
                                onClick={canView ? () => navigate("/results", { state: { sessionId: s.id } }) : undefined}
                            >
                            <div className="req-item__main">
                                <div className="req-item__head">
                                    <h3>{titleCase(s.interview_type)} interview</h3>
                                    <span className={`req-status ${status.cls}`}>{status.label}</span>
                                </div>
                                <p className="req-item__jd">
                                    {MODE_LABEL[s.mode] || "AI Interviewer"}
                                    {s.difficulty ? ` · ${titleCase(s.difficulty)} difficulty` : ""}
                                </p>
                                <div className="req-item__meta">
                                <span>{fmtDate(s.created_at)}</span>
                                {s.overall_score != null && (
                                    <span>· Score {s.overall_score}</span>
                                )}
                                </div>
                            </div>

                            <div className="req-item__actions">
                                {canView && (
                                <button
                                    className="pn-btn pn-btn--outline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/results", { state: { sessionId: s.id } });
                                    }}
                                >
                                    View results
                                </button>
                                )}
                            </div>
                            </article>
                        );
                        })}
                </section>
            )}
        </main>
    </>)
}

export default SessionHistory;