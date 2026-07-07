import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createRoomApi } from "../api/sessionApi";
import VideoPanel from "../components/VideoPanel";
import QuestionPanel from "../components/QuestionPanel";
import TranscriptPanel from "../components/TranscriptPanel";
import FeedbackPanel from "../components/FeedbackPanel";
import SessionInfo from "../components/SessionInfo";
import {
  MicIcon,
  MicOffIcon,
  CamIcon,
  CamOffIcon,
  SpeakerIcon,
  SpeakerOffIcon,
} from "../components/RoomIcons";
import { mockEvaluate } from "../utils/mockEvaluation";
import useLocalMedia from "../hooks/useLocalMedia";
import "../styles/room.css";

function formatElapsed(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function AiInterviewRoom({ settings, questions }) {
  const navigate = useNavigate();
  const localStream = useLocalMedia();

  const [roomId, setRoomId] = useState("");
  const [qIndex, setQIndex] = useState(0);
  const [scores, setScores] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [answers, setAnswers] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [ttsOn, setTtsOn] = useState(true);

  const questionStartRef = useRef(null);
  const sessionRequestedRef = useRef(false);

  /*
   * Create a session record so results have an ID to attach to.
   * AI mode has no peer, so this is bookkeeping only — if the backend
   * is unreachable we continue in offline demo mode instead of blocking.
   */
  useEffect(() => {
    if (sessionRequestedRef.current) return;
    sessionRequestedRef.current = true;
    createRoomApi()
      .then((res) => setRoomId(res?.data?.roomId ?? "OFFLINE"))
      .catch(() => setRoomId("OFFLINE"));
  }, []);

  /* Session timer */
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* Speak the question aloud when it changes (browser TTS, toggleable) */
  useEffect(() => {
    if (!ttsOn || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(questions[qIndex]);
    utterance.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [qIndex, ttsOn, questions]);

  /* Track when the current question started, for answer timing */
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [qIndex]);

  const toggleMic = () => {
    if (!localStream) return;
    const next = !micOn;
    localStream.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  };

  const toggleCam = () => {
    if (!localStream) return;
    const next = !camOn;
    localStream.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
  };

  const submitAnswer = () => {
    const startedAt = questionStartRef.current ?? Date.now();
    const answerSeconds = Math.round((Date.now() - startedAt) / 1000);
    /* Swap for: POST /evaluations { sessionId, questionId, transcript } */
    const result = mockEvaluate({ questionIndex: qIndex, answerSeconds });
    setScores(result.scores);
    setFeedback(result.feedback);
    setAnswers((prev) => [
      ...prev.filter((a) => a.index !== qIndex),
      { index: qIndex, question: questions[qIndex], ...result },
    ]);
  };

  const nextQuestion = () => {
    setScores(null);
    setFeedback("");
    setQIndex((i) => Math.min(i + 1, questions.length - 1));
  };

  const finishInterview = () => {
    window.speechSynthesis?.cancel();
    navigate("/results", {
      state: {
        settings,
        answers: [...answers].sort((a, b) => a.index - b.index),
        totalSeconds: elapsed,
        roomId,
      },
    });
  };

  const isLast = qIndex === questions.length - 1;
  const answeredCurrent = scores != null;

  return (
    <div className="room-page">
      <header className="room-header">
        <div className="room-header__group">
          <h1>AI Interview</h1>
          {roomId && <span className="rm-badge rm-badge--id">{roomId}</span>}
          <span className="rm-badge rm-badge--live">
            <span className="rm-dot rm-dot--pulse" />
            Solo session
          </span>
        </div>

        <div className="room-header__group">
          <span className="rm-badge">
            {answers.length} of {questions.length} answered
          </span>
          <span className="rm-timer">{formatElapsed(elapsed)}</span>
          <button
            className="rm-btn rm-btn--primary"
            onClick={finishInterview}
            disabled={answers.length === 0}
            title={
              answers.length === 0
                ? "Answer at least one question first"
                : "Finish and see your results"
            }
          >
            Finish interview
          </button>
        </div>
      </header>

      <main className="room-main">
        <section className="room-stage rm-anim">
          <div className="rm-video">
            <VideoPanel stream={localStream} muted mirrored />
            <span className="rm-video__label">You</span>
          </div>

          <div className="room-controlbar">
            <button
              className={`rm-ctl${micOn ? "" : " rm-ctl--off"}`}
              onClick={toggleMic}
              aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
              title={micOn ? "Mute microphone" : "Unmute microphone"}
            >
              {micOn ? <MicIcon /> : <MicOffIcon />}
            </button>

            <button
              className={`rm-ctl${camOn ? "" : " rm-ctl--off"}`}
              onClick={toggleCam}
              aria-label={camOn ? "Turn camera off" : "Turn camera on"}
              title={camOn ? "Turn camera off" : "Turn camera on"}
            >
              {camOn ? <CamIcon /> : <CamOffIcon />}
            </button>

            <button
              className={`rm-ctl${ttsOn ? " rm-ctl--active" : ""}`}
              onClick={() => {
                if (ttsOn) window.speechSynthesis?.cancel();
                setTtsOn((v) => !v);
              }}
              aria-label={ttsOn ? "Mute AI voice" : "Unmute AI voice"}
              title={ttsOn ? "AI voice on — click to mute" : "AI voice off"}
            >
              {ttsOn ? <SpeakerIcon /> : <SpeakerOffIcon />}
            </button>

            <button
              className="rm-btn rm-btn--primary"
              onClick={submitAnswer}
            >
              {answeredCurrent ? "Re-evaluate answer" : "Submit answer"}
            </button>

            {!isLast && (
              <button className="rm-btn rm-btn--outline" onClick={nextQuestion}>
                Next question
              </button>
            )}
          </div>
        </section>

        <aside className="room-side">
          <QuestionPanel
            number={qIndex + 1}
            total={questions.length}
            type={settings.type}
            question={questions[qIndex]}
          />
          <TranscriptPanel />
          <FeedbackPanel scores={scores} feedback={feedback} />
          <SessionInfo
            participantCount={1}
            roomId={roomId}
            mode={settings.mode}
            type={settings.type}
            duration={`${settings.duration} min`}
            connected={roomId !== "" && roomId !== "OFFLINE"}
          />
        </aside>
      </main>
    </div>
  );
}

export default AiInterviewRoom;
