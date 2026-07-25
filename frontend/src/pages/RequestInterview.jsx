import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import useJobDescriptions from '../hooks/useJobDescription' 
import { uploadCvApi } from "../api/documentsApi";
import { createRequestApi } from "../api/requestApi";

function RequestInterview() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const prefill = state?.prefill ?? {};

    const [jobTitle, setJobTitle] = useState("");
    const [jdId, setJdId] = useState(prefill.jobDescriptionId || "");
    const [jdText, setJdText] = useState(prefill.jobDescriptionText || "");
    const [cvFileName, setCvFileName] = useState(prefill.cvFileName || "");
    const [cvId, setCvId] = useState(prefill.cvId || null);    
    const [uploadingCv, setUploadingCv] = useState(false);
    const [preferredTime, setPreferredTime] = useState("");
    const [duration] = useState(prefill.duration || null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        document.title = "Request an interview — PitchNode";
    }, []);

    const { jobDescriptions } = useJobDescriptions();
    const selectedJd = jobDescriptions.find((j) => j.id === jdId);
    const carried = prefill.cvFileName || prefill.jobDescriptionId || prefill.jobDescriptionText;

    const onCv = async (e) => {
        const file = e.target.files?.[0];
        if (!file) 
            return;

        setCvFileName(file.name);
        setUploadingCv(true);
        try {
            const res = await uploadCvApi(file);
            setCvId(res?.id || null);
        } catch {
            setCvId(null);
            setError("Error uploading CV");
        } finally {
            setUploadingCv(false);
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        if (!jobTitle.trim()) {
            setError("Please enter the job title you're interviewing for.");
            return;
        }

        if (!jdId && !jdText.trim()) {
            setError("Choose a job description from the library, or paste your own.");
            return;
        }

        setBusy(true);

        try{
            await createRequestApi({
                job_title: jobTitle.trim(),
                jd_id: jdId || null,
                job_description: jdText.trim() || null,
                duration: duration || null,
                cv_id: cvId || null,
                cv_file_name: cvFileName || null,
                preferred_time: preferredTime? new Date(preferredTime).toISOString(): null,
            });
            navigate("/requests", { replace: true });
        } catch(err){
            setError(err?.message || "Could not submit your request. Try again.");
        } finally{
            setBusy(false)
        }
    }

    return(<>
        <nav className="pn-nav">
            <Logo/>
            <button className="pn-btn pn-btn--ghost" onClick={() => navigate("/requests")}>
                My Requests
            </button>
        </nav>

        <main className="setup-main">
           <header className="setup-head">
                <h1>Request an expert interview</h1>
                <p>
                    Tell us the role you're preparing for. 
                    An expert reviews your request and runs a live interview 
                    — you'll see the status once you submit.
                </p>
            </header>

            {carried && (
                <p className="setup-carried">
                    Carried over from setup
                    {duration ? ` · ${duration} min` : ""}. Add a job title to finish.
                </p>
            )}

            <section>
                <p className="setup-group__label">Job title</p>
                <input
                    className="pn-input"
                    placeholder="e.g. Backend Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                />
            </section>

            <section className="setup-docs">
                <p className="setup-group__label">Job description *</p>

                <div className="setup-jd">
                    <select
                        className="pn-input setup-jd__select"
                        value={jdId}
                        onChange={(e) => {
                            setJdId(e.target.value);
                            if (e.target.value) setJdText("");
                        }}
                        >
                        <option value="">Choose from our library…</option>
                        {jobDescriptions.map((jd) => (
                            <option key={jd.id} value={jd.id}>
                            {jd.title} — {jd.company}
                            </option>
                        ))}
                    </select>

                    {selectedJd && (
                        <p className="setup-jd__summary">{selectedJd.summary}</p>
                    )}

                    {!jdId && ( <>
                        <p className="setup-jd__or">or paste your own</p>
                        <textarea
                        className="pn-input setup-jd__textarea"
                        rows={4}
                        placeholder="Paste the job description you're preparing for…"
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        />
                    </> )} 

                </div>
            </section>

            <section className="setup-docs">
                <p className="setup-group__label">
                    Resume / CV <span className="setup-optional">optional</span>
                </p>
                <div className="setup-upload">
                    <input
                        ref={fileRef}
                        type="file"
                        accept="application/pdf"
                        onChange={onCv}
                        hidden
                    />
                    <button
                        className="pn-btn pn-btn--ghost"
                        onClick={() => fileRef.current?.click()}
                    >
                        {uploadingCv ? "Uploading…" : cvFileName ? "Replace CV" : "Upload CV (PDF)"}
                    </button>
                    {cvFileName ? (
                        <span className="setup-upload__file">
                            {cvFileName}
                            <button
                                className="setup-upload__clear"
                                onClick={() => setCvFileName("")}
                                aria-label="Remove CV"
                            >
                                ✕
                            </button>
                        </span>
                    ) : (
                    <span className="setup-upload__hint">
                        Helps the expert tailor the interview to your experience.
                    </span>
                    )}
                </div>
            </section>

            <section>
                <p className="setup-group__label">
                    Preferred time 
                    <span className="setup-optional">optional</span>
                </p>
                <input
                    type="datetime-local"
                    className="pn-input setup-time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                />
            </section>

            {error && (
                <p className="auth-error setup-error" role="alert">
                    {error}
                </p>
            )}

            <footer className="setup-footer">
                <p className="setup-summary">
                    <strong>Human interview</strong>
                    {cvFileName && (
                    <>
                        {" "}· <strong>CV attached</strong>
                    </>
                    )}
                    {(jdId || jdText.trim()) && (
                    <>
                        {" "}·{" "}
                        <strong>{selectedJd ? selectedJd.title : "Custom JD"}</strong>
                    </>
                    )}
                    {duration && (
                    <>
                        {" "}· <strong>{duration} min</strong>
                    </>
                    )}
                </p>

                <div className="setup-footer__actions">
                    <button
                    className="pn-btn pn-btn--ghost"
                    onClick={() => navigate("/setup")}
                    >
                    Back
                    </button>
                    <button
                    className="pn-btn pn-btn--primary"
                    onClick={submit}
                    disabled={busy}
                    >
                    {busy ? "Submitting…" : "Submit request"}
                    </button>
                </div>
            </footer>         
        </main>
    </>);
}

export default RequestInterview;