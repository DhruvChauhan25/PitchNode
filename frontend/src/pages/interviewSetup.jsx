import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import {
  INTERVIEW_TYPES,
  DIFFICULTIES,
  DURATIONS,
} from "../data/questionBank";
import { PLANS, CURRENT_USER_PLAN, getSessionsLeft } from "../config/plans";
import useJobDescritpions from "../hooks/useJobDescription.js";
import { uploadCvApi, createJdApi } from "../api/documentsApi.js";
import useUserDocuments from "../hooks/useUserDocuments.js";

const MODES = [
  {
    id: "ai",
    name: "AI Interviewer",
    tag: "Solo",
    desc: "Practice alone. The AI asks questions, listens to your answers, and scores each one instantly.",
  },
  {
    id: "human",
    name: "With a Human",
    tag: "Two-way",
    desc: "Invite a peer or mentor into a live video room. They run the interview their way.",
  },
  {
    id: "friend",
    name: "With a Friend",
    tag: "Guided",
    desc: "You answer on camera while your friend reads AI-generated questions from a prompter.",
  },
];

const TYPE_DESCRIPTIONS = {
  Technical:
    "Algorithms, system design, and core CS concepts, scored on a structured rubric.",
  Behavioral:
    "STAR-format questions about past situations, actions, and outcomes.",
  HR: 
    "Motivation, fit, and career questions from real screening rounds.",
};

const STEPS = ["Mode", "Documents", "Configuration"];

const NEW_CV_OPTION = "--upload_new__";

function Segmented({ options, value, onChange, format = (v) => v, label }) {
  return (
    <div className="setup-seg" role="radiogroup" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt}
          role="radio"
          aria-checked={value === opt}
          className={`setup-seg__opt${
            value === opt ? " setup-seg__opt--active" : ""
          }`}
          onClick={() => onChange(opt)}
        >
          {format(opt)}
        </button>
      ))}
    </div>
  );
}

function InterviewSetup() {
  const navigate = useNavigate();
  const {jobDescriptions} = useJobDescritpions();
  const { cvs: savedCvs, jds: savedJds, loading: docsLoading } = useUserDocuments();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState("ai");

  const [cvChoice, setCvChoice] = useState(""); // "" | NEW_CV_OPTION | existing cv id
  const [pendingCvFile, setPendingCvFile] = useState(null);
  const [cvId, setCvId] = useState(null);
  const [cvFileName, setCvFileName] = useState("");
  const [uploadingCv, setUploadingCv] = useState(false);

  const [jdId, setJdId] = useState("");
  const [jdText, setJdText] = useState("");
  const [jdTitle, setJdTitle] = useState("");
  const [jdCompany, setJdCompany] = useState(""); 

  const [type, setType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  const [duration, setDuration] = useState(30);
  const [error, setError] = useState("");
  const [persisting, setPersisting] = useState(false);

  const plan = PLANS[CURRENT_USER_PLAN];
  const sessionsLeft = getSessionsLeft();

  useEffect(() => {
    document.title = "Set up your interview — PitchNode";
  }, []);

  const onCvPicked = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    //upload when hits continue
    setPendingCvFile(file);
    setCvFileName(file.name);
    setCvId(null);
    setError("");
  };

  const onCvChoiceChange = (value) => {
    setCvChoice(value);

    if(value === NEW_CV_OPTION){
      setCvId(null);
      setPendingCvFile(null);
      setCvFileName("");
      fileInputRef.current?.click();
    } else if (value === ""){
      setCvId(null);
      setPendingCvFile(null);
      setCvFileName("");
    } else {
      //exixting cv was picked, so id is already there
      const chosen = savedCvs.find((c) => c.id === value);
      setCvId(value);
      setPendingCvFile(null);
      setCvFileName(chosen?.file_name || "");
    }
  }

  // when hits continue, upload a fresh CV and/or create a fresh JD,
  const persistDocuments = async() => {
    setError("");

    const hasJd = Boolean(jdId) || jdText.trim().length > 0;
    if(!hasJd){
      setError("A job description is required to continue.");
      return false;
    }

    if (!jdId && jdText.trim() && (!jdTitle.trim() || !jdCompany.trim())) {
      setError("Add a role title and company for your pasted job description.");
      return false;
    }

    setPersisting(true);
    try{
      let resolvedCvId = cvId;
      if(pendingCvFile && !resolvedCvId){
        try {
          const res = await uploadCvApi(pendingCvFile);
          resolvedCvId = res?.id || null;
          setCvId(resolvedCvId);
        } catch {
          setError("Couldn't upload your CV. You can continue without it or try again.");
          return false;
        }
      }

      let resolvedJdId = jdId;
      if (!resolvedJdId && jdText.trim()) {
        try {
          const res = await createJdApi({
            title: jdTitle.trim(),
            company: jdCompany.trim(),
            text: jdText.trim(),
          });
          resolvedJdId = res?.id || null;
          setJdId(resolvedJdId);
        } catch {
          setError("Couldn't save your job description. Please try again.");
          return false;
        }
      }

      return true;
    } finally {
      setPersisting(false);
    }
  }

  const goNext = async () => {
    if (step === 1) {
      const ok = await persistDocuments();
      if (!ok) return;
    }
    setStep((s) => s + 1);
  }

  const startInterview = () => {

    if(mode === "human"){
      navigate("/request", {
        state: {
          prefill: {
            jobDescriptionId: jdId || null,
            jobDescriptionText: jdText.trim() || null,
            cvFileName: cvFileName || null,
            cvId: cvId || null,
            duration,
          },
        },
      });
      return;
    }

    navigate("/room", {
      state: {
        settings: {
          mode,
          type,
          difficulty,
          duration,
          cvFileName: cvFileName || null,
          cvId: cvId || null,
          jobDescriptionId: jdId || null,
          jobDescriptionText: jdText.trim() || null,
        },
      },
    });
  };


  const allJds = [...savedJds.map((j) => ({...j, _own:true })), ...jobDescriptions]
  const selectedJd = allJds.find((j) => j.id === jdId);

  return (
    <>
      <nav className="pn-nav">
        <Logo />
        <span className="pn-pill">
          {plan.name} plan ·{" "}
          {sessionsLeft === Infinity
            ? "Unlimited sessions"
            : `${sessionsLeft} of ${plan.sessionsPerMonth} sessions left`}
        </span>
      </nav>

      <main className="setup-main">
        <header className="setup-head">
          <h1>Set up your interview</h1>
          <p>
            Three quick steps. Your documents and settings shape the questions
            you get and how answers are scored.
          </p>
        </header>

        <ol className="setup-stepper" aria-label="Setup progress">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`setup-stepper__item${
                i === step ? " setup-stepper__item--active" : ""
              }${i < step ? " setup-stepper__item--done" : ""}`}
              aria-current={i === step ? "step" : undefined}
            >
              <span className="setup-stepper__num">{i + 1}</span>
              {label}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <section>
            <p className="setup-group__label">How do you want to practice?</p>
            <div className="setup-types setup-types--modes">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  className={`setup-type${
                    mode === m.id ? " setup-type--active" : ""
                  }`}
                  onClick={() => setMode(m.id)}
                  aria-pressed={mode === m.id}
                >
                  <span className="setup-type__tag">{m.tag}</span>
                  <span className="setup-type__name">{m.name}</span>
                  <span className="setup-type__desc">{m.desc}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="setup-docs">
            <p className="setup-group__label">
              Tailor your questions <span className="setup-optional">optional</span>
            </p>

            <div className="setup-upload">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={onCvPicked}
                hidden
              />

              {/* suggest already existing cvs-if user already have */}
              {savedCvs.length > 0 ? (
                <select
                  className="pn-input"
                  value={cvChoice}
                  onChange={(e) => onCvChoiceChange(e.target.value)}
                  disabled={docsLoading}
                >
                  <option value="">No CV — skip tailoring</option>
                  {savedCvs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.file_name}
                    </option>
                  ))}
                  <option value={NEW_CV_OPTION}>Upload a new CV…</option>
                </select>
              ) : (
                <button
                className="pn-btn pn-btn--ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                {cvFileName ? "Replace CV" : "Upload CV (PDF)"}
              </button>
              )}
              
              {cvFileName ? (
                <span className="setup-upload__file">
                  {cvFileName}
                  {pendingCvFile && <span className="setup-upload__pending"> (will upload on Continue)</span>}
                  <button
                    className="setup-upload__clear"
                    onClick={() => {
                      setCvId(null);
                      setPendingCvFile(null);
                      setCvFileName("")
                      setCvChoice("");

                      if(fileInputRef.current)
                        fileInputRef.current.value = "";
                    }}
                    aria-label="Remove CV"
                  >
                    ✕
                  </button>
                </span>
              ) : (
                <span className="setup-upload__hint">
                  Questions get tailored to your experience.
                </span>
              )}
            </div>

            <div className="setup-jd">
              <label className="setup-jd__label" htmlFor="jd-select">
                Job description *
              </label>
              <select
                id="jd-select"
                className="pn-input setup-jd__select"
                value={jdId}
                onChange={(e) => {
                  setJdId(e.target.value);
                  if (e.target.value) setJdText("");
                }}
              >
                <option value="">Choose from Existings ...</option>

                //user's previous used
                {savedJds.length > 0 && (
                  <optgroup label="Your saved job descriptions">
                    {savedJds.map((jd) => (
                      <option key={jd.id} value={jd.id}>
                        {jd.title} — {jd.company}
                      </option>
                    ))}
                  </optgroup>
                )}

                //from systemn's library
                <optgroup label="Library">
                  {jobDescriptions.map((jd) => (
                    <option key={jd.id} value={jd.id}>
                      {jd.title} — {jd.company}
                    </option>
                  ))}
                </optgroup>
              </select>

              {selectedJd && (
                <p className="setup-jd__summary">{selectedJd.summary}</p>
              )}

              {!jdId && (
                <>
                  <p className="setup-jd__or">or paste your own</p>
                  <textarea
                    className="pn-input setup-jd__textarea"
                    rows={4}
                    placeholder="Paste the job description you're preparing for…"
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                  />

                  {jdText.trim() && (
                    <div className="setup-jd__custom-meta">
                      <input
                        className="pn-input"
                        placeholder="Role title (e.g. Backend Engineer)"
                        value={jdTitle}
                        onChange={(e) => setJdTitle(e.target.value)}
                      />
                      <input
                        className="pn-input"
                        placeholder="Company Name"
                        value={jdCompany}
                        onChange={(e) => setJdCompany(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            {error && <p className="setup-error">{error}</p>}
          </section>
        )}

        {step === 2 && (
          <>
            <section>
              <p className="setup-group__label">Interview type</p>
              <div className="setup-types">
                {INTERVIEW_TYPES.map((t) => (
                  <button
                    key={t}
                    className={`setup-type${
                      t === type ? " setup-type--active" : ""
                    }`}
                    onClick={() => setType(t)}
                    aria-pressed={t === type}
                  >
                    <span className="setup-type__name">{t}</span>
                    <span className="setup-type__desc">
                      {TYPE_DESCRIPTIONS[t]}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="setup-group__label">Difficulty</p>
              <Segmented
                options={DIFFICULTIES}
                value={difficulty}
                onChange={setDifficulty}
                label="Difficulty"
              />
            </section>

            <section>
              <p className="setup-group__label">Duration</p>
              <Segmented
                options={DURATIONS}
                value={duration}
                onChange={setDuration}
                format={(d) => `${d} min`}
                label="Duration"
              />
            </section>
          </>
        )}

        <footer className="setup-footer">
          <p className="setup-summary">
            <strong>{MODES.find((m) => m.id === mode)?.name}</strong>
            {cvFileName && (
              <>
                {" "}
                · <strong>CV attached</strong>
              </>
            )}
            {(jdId || jdText.trim()) && (
              <>
                {" "}
                · <strong>{selectedJd ? selectedJd.title : "Custom JD"}</strong>
              </>
            )}
            {step === 2 && (
              <>
                {" "}
                · <strong>{type}</strong> · <strong>{difficulty}</strong> ·{" "}
                <strong>{duration} min</strong>
              </>
            )}
          </p>

          <div className="setup-footer__actions">
            {step > 0 && (
              <button
                className="pn-btn pn-btn--ghost"
                onClick={() => setStep((s) => s - 1)}
                disabled={persisting}
              >
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                className="pn-btn pn-btn--primary"
                onClick={goNext}
                disabled={persisting}
              >
                {persisting ? "Saving…" : "Continue"}
              </button>
            ) : (
              <button
                className="pn-btn pn-btn--primary"
                onClick={startInterview}
              >
                Start interview
              </button>
            )}
          </div>
        </footer>
      </main>
    </>
  );
}

export default InterviewSetup;
