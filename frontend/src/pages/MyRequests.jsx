import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { JOB_DESCRIPTIONS } from "../data/jobDescriptions";
import { listMyRequestsApi, cancelRequestApi } from "../api/requestApi";
import "../styles/requests.css"

const STATUS = {
  pending: { label: "Pending review", cls: "req-status--pending" },
  accepted: { label: "Accepted", cls: "req-status--accepted" },
  declined: { label: "Declined", cls: "req-status--declined" },
  in_progress: { label: "In progress", cls: "req-status--accepted" },
  completed: { label: "Completed", cls: "req-status--done" },
  evaluated: { label: "Evaluated", cls: "req-status--done" },
  cancelled: { label: "Cancelled", cls: "req-status--cancelled" },
  expired: { label: "Expired", cls: "req-status--cancelled" },
};

const jdTitle = (r) => {
    if(r.jd_id) {
        const jd = JOB_DESCRIPTIONS.find((j) => j.id === r.jd_id);
        if(jd) return jd.title;
    }
    return r.job_description ? "Custom job description" : "—";
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

function MyRequests() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        try{
            const data = await listMyRequestsApi();
            setRequests(data.requests || []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        document.title = "My requests - PitchNode";
        let cancelled = false;
        (async () => {
            if (!cancelled) await load();
        })();
        return () => {
            cancelled = true;
        };
    }, [load]);

    const cancel = async (id) => {
        setBusyId(id);
        try{
            await cancelRequestApi(id);
            setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled"} : r)));
        } finally {
            setBusyId(null)
        }
    };

    return (
        <>
            <nav className="pn-nav">
                <Logo />
                <button
                    className="pn-btn pn-btn--primary"
                    onClick={() => navigate("/request")}
                >
                    New request
                </button>
            </nav>

            <main className="admin-main">
                <header className="admin-head">
                    <h1>My Interview Requests</h1>
                    <p>Track you request here</p>
                </header>

                {loading ? (
                    <div className="pn-card admin-table">
                        <p className="admin-empty">Loading your requests…</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="pn-card admin-table">
                        <p className="admin-empty">
                        You haven't requested any expert interviews yet.
                        <br />
                        <button
                            className="pn-btn pn-btn--primary req-empty-cta"
                            onClick={() => navigate("/request")}
                        >
                            Request your first interview
                        </button>
                        </p>
                    </div>
                ): (
                    <section className="req-list">
                        { requests.map((r) => {
                            const s = STATUS[r.status] || STATUS.pending;
                            const canCancel = ["pending", "accepted"].includes(r.status);
                            return(
                                <article className="pn-card req-item" key={r.id}>
                                    <div className="req-item__main">
                                        <div className="req-item__head">
                                        <h3>{r.job_title}</h3>
                                        <span className={`req-status ${s.cls}`}>{s.label}</span>
                                        </div>
                                        <p className="req-item__jd">{jdTitle(r)}</p>
                                        <div className="req-item__meta">
                                        <span>Requested {fmtDate(r.created_at)}</span>
                                        {r.preferred_time && (
                                            <span>· Preferred {fmtDate(r.preferred_time)}</span>
                                        )}
                                        {r.cv_file_name && <span>· CV attached</span>}
                                        </div>
                                    </div>

                                    <div className="req-item__actions">
                                        {r.status === "accepted" && r.room_id && (
                                        <button
                                            className="pn-btn pn-btn--primary"
                                            onClick={() =>
                                            navigate("/room", {
                                                state: { settings: { mode: "human" }, roomId: r.room_id } })
                                            }
                                        >
                                            Join room
                                        </button>
                                        )}
                                        {(r.status === "completed" || r.status === "evaluated") && (
                                        <button
                                            className="pn-btn pn-btn--outline"
                                            onClick={() =>
                                            navigate("/results", { state: { sessionId: r.session_id } })
                                            }
                                        >
                                            View results
                                        </button>
                                        )}
                                        {canCancel && (
                                        <button
                                            className="pn-btn pn-btn--ghost"
                                            disabled={busyId === r.id}
                                            onClick={() => cancel(r.id)}
                                        >
                                            {busyId === r.id ? "Cancelling…" : "Cancel"}
                                        </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                
                )}
            </main>
        </>
    );
}

export default MyRequests;