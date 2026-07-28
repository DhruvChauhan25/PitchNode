import { useEffect, useState, useRef, useSyncExternalStore } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";

import { createRoomApi, checkRoomApi } from "../api/sessionApi";
import VideoPanel from "../components/VideoPanel";
import RoomControls from "../components/RoomControls";
import QuestionPanel from "../components/QuestionPanel";
import TranscriptPanel from "../components/TranscriptPanel";
import FeedbackPanel from "../components/FeedbackPanel";
import SessionInfo from "../components/SessionInfo";
import {
  MicIcon,
  MicOffIcon,
  CamIcon,
  CamOffIcon,
  ScreenIcon,
  LeaveIcon,
  CopyIcon,
  CheckIcon,
} from "../components/RoomIcons";
import { getQuestions } from "../data/questionBank";
import useLiveSession from "../hooks/useLiveSession";
import { mockEvaluate } from "../utils/mockEvaluation";
import AiInterviewRoom from "./AiInterviewRoom";
import useLocalMedia from "../hooks/useLocalMedia";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import usePeerConnection from "../hooks/usePeerConnection";
import "../styles/room.css";

const BASE = import.meta.env.VITE_API_BASE_URL;

function formatElapsed(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

const DEFAULT_SETTINGS = {
  mode: "human",
  type: "Technical",
  difficulty: "Medium",
  duration: 30,
};

function LiveInterviewRoom({ settings, questions }) {
  const navigate = useNavigate();

  const cameFromLinkRef = useRef(
    Boolean(new URLSearchParams(window.location.search).get("roomId")),
  );
  const cameFromLink = cameFromLinkRef.current;

  const wantsManualJoinRef = useRef(
    new URLSearchParams(window.location.search).get("join") === "1",
  );
  const wantsManualJoin = wantsManualJoinRef.current;

  const [createdRoomId, setCreatedRoomId] = useState("");
  const [roomId, setRoomId] = useState(
    () => new URLSearchParams(window.location.search).get("roomId") || "",
  );
  const [participantCount, setParticipantCount] = useState(0);
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [participantJoinedSignal, setParticipantJoinedSignal] = useState(0);
  const [error, setError] = useState("");

  //lobby state
  const [linkParticipantCount, setLinkParticipantCount] = useState(0);
  const [roomCheckError, setRoomCheckError] = useState("");
  const [blockedLeaveMsg, setBlockedLeaveMsg] = useState("");

  const [peerLeftNotice, setPeerLeftNotice] = useState(false);
  const prevParticipantCountRef = useRef(0);

  /* UI-only state — no signaling impact */
  const [elapsed, setElapsed] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  //question navigation
  const [qIndex, setQIndex] = useState(0);

  //host broadcast its real settings + question list
  const [remoteSettings, setRemoteSettings] = useState(null);
  const [remoteQuestions, setRemoteQuestions] = useState(null);
  const [remoteSessionId, setRemoteSessionId] = useState(null);

  //capturing the candidate's transcript
  const [remoteCandidateTranscript, setRemoteCandidateTranscript] = useState("");

  const effectiveSettings =
    !isHost && remoteSettings ? remoteSettings : settings;

  const isFriendMode = effectiveSettings.mode === "friend";

  //role split, creator (host) vs joiner (interviewer)
  const isInterviewer = isFriendMode ? !isHost : true;

  const canFinish = !isHost;

  //participant labels
  const localLabel = isHost ? "Interviewee" : "Peer";
  const remoteLabel = isHost ? "Peer" : "Interviewee";

  //n=backend session
  const {
    sessionId,
    serverQuestions,
    scores,
    feedback,
    scoring,
    answers,
    evaluateAnswer,
    clearScores,
    completeSession,
  } = useLiveSession({
    settings,
    isHost,
    sessionIdOverride: !isHost ? remoteSessionId : null,
  });

  const activeQuestions =
    serverQuestions && serverQuestions.length
      ? serverQuestions
      : !isHost && remoteQuestions && remoteQuestions.length
        ? remoteQuestions
        : questions;

  const currentQ = activeQuestions[qIndex];
  const currentQuestionText =
    typeof currentQ === "string" ? currentQ : (currentQ?.prompt ?? "");
  const currentQuestionId =
    typeof currentQ === "string" ? null : (currentQ?.id ?? null);

  const [displayScores, setDisplayScores] = useState(null);
  const [displayFeedback, setDisplayFeedback] = useState("");
  const [displayIsMock, setDisplayIsMock] = useState(false);

  const screenTrackRef = useRef(null);

  const {
    supported,
    lines,
    interim,
    transcript,
    error: speechError,
    reset: resetTranscript,
  } = useSpeechRecognition({ enabled: joined && micOn });

  //evaluating candidate's transcript
  const candidateAnswerTranscript = isHost
    ? [transcript, interim].filter(Boolean).join(" ").trim()
    : remoteCandidateTranscript


  const socketRef = useRef(null);
  if (!socketRef.current) {
    socketRef.current = io(BASE);
  }
  const socket = socketRef.current;

  const localStream = useLocalMedia();
  const { peerConnectionRef, remoteStream } = usePeerConnection({
    socket,
    roomId,
    localStream,
  });

  useEffect(() => {
    socket.on("participant-count", (count) => {
      if (
        isHost &&
        joined &&
        prevParticipantCountRef.current >= 2 &&
        count < 2
      ) {
        setPeerLeftNotice(true);
      }
      prevParticipantCountRef.current = count;
      setParticipantCount(count);
    });

    socket.off("participant-joined");
    socket.on("participant-joined", () => {
      setParticipantJoinedSignal((prev) => prev + 1);
    });

    //frined-mode, interviewer drives navigation and emits
    socket.off("question-changed");
    socket.on("question-changed", ({ questionIndex }) => {
      if (typeof questionIndex === "number") {
        setQIndex(questionIndex);
      }
      resetTranscript();
      setRemoteCandidateTranscript("");
    });

    //host broadcast its real settings + question list
    socket.off("session-info");
    socket.on(
      "session-info",
      ({
        settings: hostSettings,
        questions: hostQuestions,
        sessionId: hostSessionId,
      }) => {
        if (isHost) return;
        if (hostSettings) setRemoteSettings(hostSettings);
        if (Array.isArray(hostQuestions) && hostQuestions.length)
          setRemoteQuestions(hostQuestions);
        if (hostSessionId) setRemoteSessionId(hostSessionId);
      },
    );

    //broadcast evaluatye answere
    socket.off("answer-evaluated");
    socket.on("answer-evaluated", ({ result }) => {
      if (!result) return;
      setDisplayScores(result.scores ?? null);
      setDisplayFeedback(result.feedback ?? "");
      setDisplayIsMock(Boolean(result.isMock));
    });

    //candidate's live transcript relayed
    socket.off("candidate-transcript");
    socket.on("candidate-transcript", ({ transcript: relayedTranscript }) => {
      if (isHost) return;
      setRemoteCandidateTranscript(relayedTranscript ?? "");
    });

    socket.off("interview-finished");
    socket.on(
      "interview-finished",
      async ({ answers: finalAnswers, sessionId: finalSessionId }) => {
        //only the host actually receive this
        if(isHost){
          await completeSession();
        }
        navigate("/results", {
          state: {
            settings: effectiveSettings,
            answers: finalAnswers ?? [],
            sessionId: finalSessionId,
          },
        });
      },
    );

    return () => {
      socket.off("participant-count");
      socket.off("participant-joined");
      socket.off("question-changed");
      socket.off("session-info");
      socket.off("answer-evaluated");
      socket.off("candidate-transcript");
      socket.off("interview-finished");
    };
  }, [socket, isHost, navigate, effectiveSettings, completeSession, resetTranscript]);

  useEffect(() => {
    if (!isHost || !roomId || participantJoinedSignal === 0) return;
    socket.emit("session-info", {
      roomId,
      settings,
      questions: activeQuestions,
      sessionId,
    });
  }, [
    isHost,
    roomId,
    participantJoinedSignal,
    serverQuestions,
    questions,
    socket,
    settings,
    sessionId,
  ]);

  useEffect(() => {
    if (!isHost || !roomId) return;
    socket.emit("candidate-transcript", {
      roomId,
      transcript: candidateAnswerTranscript,
    });
  }, [isHost, roomId, candidateAnswerTranscript, socket]);

  useEffect(() => {
    if (!isHost || participantJoinedSignal === 0 || !localStream) return;

    const pc = peerConnectionRef.current;
    if (!pc) return;

    let cancelled = false;

    (async () => {
      const offer = await pc.createOffer();
      if (cancelled) return;
      await pc.setLocalDescription(offer);
      socket.emit("offer", { roomId, offer });
    })();

    return () => {
      cancelled = true;
    };
  }, [isHost, participantJoinedSignal, localStream, roomId]);

  /* Track Socket.IO connection for the status badge */
  const connected = useSyncExternalStore(
    (notify) => {
      socket.on("connect", notify);
      socket.on("disconnect", notify);
      return () => {
        socket.off("connect", notify);
        socket.off("disconnect", notify);
      };
    },
    () => socket.connected,
  );

  /* Session timer — runs while joined */
  useEffect(() => {
    if (!joined) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [joined]);

  const createRoom = async () => {
    try {
      const response = await createRoomApi();
      const newRoomId = response?.data?.roomId;

      setCreatedRoomId(newRoomId);
      setRoomId(newRoomId);
      setIsHost(true);
      setElapsed(0);
      setJoined(true);

      socket.emit("join-session", newRoomId);
    } catch (err) {
      console.error("Error creating room:", err);
      setError("Could not create a room. Is the session service running?");
    }
  };

  const autoCreateStartedRef = useRef(false);
  useEffect(() => {
    if (
      cameFromLink ||
      wantsManualJoin ||
      joined ||
      autoCreateStartedRef.current
    )
      return;
    autoCreateStartedRef.current = true;
    createRoom();
  }, [cameFromLink, joined]);

  useEffect(() => {
    if (!cameFromLink || wantsManualJoin || joined || !roomId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await checkRoomApi(roomId);
        if (cancelled) return;
        if (!res.data.exists) {
          setRoomCheckError("This room doesn't exist or has ended.");
        } else {
          setLinkParticipantCount(res.data.participantCount ?? 0);
        }
      } catch {
        if (!cancelled)
          setRoomCheckError("Could not reach the session service.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cameFromLink, roomId, joined]);

  const joinRoom = async () => {
    if (!roomId) {
      setError("Please enter a valid Room ID");
      return;
    }

    try {
      const response = await checkRoomApi(roomId);

      if (!response.data.exists) {
        setError("Room does not exist. Please check the Room ID.");
        return;
      }

      socket.emit("join-session", roomId);
      setElapsed(0);
      setJoined(true);
      setError("");
    } catch (err) {
      console.error("Error joining room:", err);
      setError("Could not reach the session service.");
    }
  };

  const leaveRoom = () => {
    if (!roomId) {
      setError("No Room ID found. Cannot leave room.");
      return;
    }

    if (sharing) stopScreenShare();

    socket.emit("leave-session", roomId);

    /* Re-enable local tracks so the next session starts clean */
    peerConnectionRef.current?.close();
    localStream?.getAudioTracks().forEach((t) => t.stop());
    localStream?.getVideoTracks().forEach((t) => t.stop());

    setJoined(false);
    setIsHost(false);
    setCreatedRoomId("");
    setRoomId("");
    setParticipantCount(0);
    setMicOn(false);
    setCamOn(false);

    navigate("/");
  };

  const handleLeaveClick = () => {
    if (isHost && !peerLeftNotice) {
      setBlockedLeaveMsg("You can't leave while the interview is in progress.");
      setTimeout(() => setBlockedLeaveMsg(""), 4000);
      return;
    }
    leaveRoom();
  };

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

  function stopScreenShare() {
    const camTrack = localStream?.getVideoTracks()[0];
    const sender = peerConnectionRef.current
      ?.getSenders()
      .find((s) => s.track && s.track.kind === "video");
    if (sender && camTrack) sender.replaceTrack(camTrack);
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    setSharing(false);
  }

  const toggleScreenShare = async () => {
    if (sharing) {
      stopScreenShare();
      return;
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const track = display.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        ?.getSenders()
        .find((s) => s.track && s.track.kind === "video");
      if (sender) await sender.replaceTrack(track);
      track.onended = () => stopScreenShare();
      screenTrackRef.current = track;
      setSharing(true);
    } catch (err) {
      console.error("Screen share failed:", err);
    }
  };

  const copyRoomLink = async () => {
    if (!roomId) return;
    const link = `${window.location.origin}/room?roomId=${roomId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Could not copy link:", err);
    }
  };

  const copyRoomCode = async () => {
    if (!roomId) return;
    const code = `${roomId}`;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Could not copy code:", err);
    }
  };

  const goToQuestion = (next) => {
    const clamped = Math.max(0, Math.min(next, activeQuestions.length - 1));
    setQIndex(clamped);

    //Sync to the peer via session-service relay
    if (roomId)
      socket.emit("question-changed", { roomId, questionIndex: clamped });
  };

  const nextQuestion = async () => {

    //sending candidate transcript now
    const result = await evaluateAnswer({
      questionIndex: qIndex,
      questionId: currentQuestionId,
      questionText: currentQuestionText,
      transcript: candidateAnswerTranscript,
      mockEvaluate,
    });

    if (result) {
      setDisplayScores(result.scores ?? null);
      setDisplayFeedback(result.feedback ?? "");
      setDisplayIsMock(Boolean(result.isMock));
      if (roomId)
        socket.emit("answer-evaluated", {
          roomId,
          questionIndex: qIndex,
          result,
        });
    }
    resetTranscript();
    goToQuestion(qIndex + 1);
  };

  const prevQuestion = () => {
    clearScores();
    setDisplayScores(null);
    setDisplayFeedback("");
    setDisplayIsMock(false);
    resetTranscript();
    goToQuestion(qIndex - 1);
  };

  const finishAsInterviewer = () => {
    const sortedAnswers = [...answers].sort((a, b) => a.index - b.index);
    if (roomId) {
      socket.emit("interview-finished", {
        roomId,
        answers: sortedAnswers,
        sessionId,
      });
    }
    navigate("/");
  };

  const live = connected && participantCount >= 2;

  return (
    <div className="room-page">
      <header className="room-header">
        <div className="room-header__group">
          <h1>Interview Room</h1>
          {joined && roomId && (
            <span className="rm-badge rm-badge--id">{roomId}</span>
          )}
          <span
            className={`rm-badge ${
              !connected
                ? "rm-badge--off"
                : live
                  ? "rm-badge--live"
                  : "rm-badge--wait"
            }`}
          >
            <span className={`rm-dot${live ? " rm-dot--pulse" : ""}`} />
            {!connected ? "Disconnected" : live ? "Live" : "Waiting"}
          </span>
          { joined &&
            <button className="rm-btn rm-btn--outline" onClick={copyRoomCode}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Copied" : "Copy Code"}
            </button>
          }
           
        </div>

        <div className="room-header__group">
          <span className="rm-badge">
            {participantCount} participant{participantCount === 1 ? "" : "s"}
          </span>
          {joined && <span className="rm-timer">{formatElapsed(elapsed)}</span>}
          {joined && (
            <>
              <button className="rm-btn rm-btn--outline" onClick={copyRoomLink}>
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </>
          )}
          {joined && (
            <button
              className="rm-btn rm-btn--danger"
              onClick={handleLeaveClick}
            >
              Leave
            </button>
          )}
        </div>
      </header>

      {joined && blockedLeaveMsg && (
        <div className="rm-alert rm-alert--err rm-leave-block" role="alert">
          {blockedLeaveMsg}
        </div>
      )}

      {joined && peerLeftNotice && (
        <div className="rm-alert rm-alert--err rm-leave-block" role="alert">
          Your interviewer left the session without finishing — you're free to
          leave.
          <button className="rm-btn rm-btn--outline" onClick={leaveRoom}>
            Leave
          </button>
        </div>
      )}

      {!joined ? (
        <main className="room-lobby">
          {cameFromLink ? (
            roomCheckError ? (
              <RoomControls
                variant="error"
                error={roomCheckError}
                goHome={() => navigate("/")}
              />
            ) : (
              <RoomControls
                variant="join-link"
                participantCount={linkParticipantCount}
                error={error}
                joinRoom={joinRoom}
                goHome={() => navigate("/")}
              />
            )
          ) : wantsManualJoin ? (
            <RoomControls
              variant="manual-join"
              roomId={roomId}
              setRoomId={setRoomId}
              error={error}
              joinRoom={joinRoom}
              goHome={() => navigate("/")}
            />
          ) : (
            <RoomControls variant="creating" error={error} />
          )}
        </main>
      ) : (
        <main className="room-main">
          <section className="room-stage rm-anim">
            <div className="rm-video">
              <VideoPanel stream={remoteStream} muted={false} />
              {!remoteStream && (
                <div className="rm-video__empty">
                  <span
                    className="pn-node"
                    style={{ width: 14, height: 14 }}
                    aria-hidden="true"
                  />
                  Waiting for the other participant to join…
                  <br />
                  Share the room link to invite them.
                </div>
              )}
              <span className="rm-video__label">{remoteLabel}</span>

              <div className="rm-video rm-video--pip">
                <VideoPanel stream={localStream} muted mirrored />
                <span className="rm-video__label">You · {localLabel}</span>
              </div>
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
                className={`rm-ctl${sharing ? " rm-ctl--active" : ""}`}
                onClick={toggleScreenShare}
                aria-label={sharing ? "Stop sharing screen" : "Share screen"}
                title={sharing ? "Stop sharing screen" : "Share screen"}
              >
                <ScreenIcon />
              </button>

              <button
                className="rm-ctl rm-ctl--leave"
                onClick={handleLeaveClick}
                aria-label="Leave interview"
              >
                <LeaveIcon />
                Leave
              </button>
            </div>
          </section>

          <aside className="room-side">
            {isInterviewer ? (
              <>
                <QuestionPanel
                  number={qIndex + 1}
                  total={activeQuestions.length}
                  type={effectiveSettings.type}
                  question={currentQuestionText}
                  prompter={isFriendMode}
                />

                <div className="rm-qnav">
                  <button
                    className="rm-btn rm-btn--outline"
                    onClick={prevQuestion}
                    disabled={qIndex === 0 || scoring}
                  >
                    Previous
                  </button>
                  <span className="rm-qnav__count">
                    {qIndex + 1} / {activeQuestions.length}
                  </span>
                  <button
                    className="rm-btn rm-btn--primary"
                    onClick={nextQuestion}
                    disabled={qIndex === activeQuestions.length - 1}
                  >
                    {scoring ? "Scoring..." : "Next question"}
                  </button>
                </div>

                <TranscriptPanel
                  lines={remoteCandidateTranscript ? [remoteCandidateTranscript] : []}
                  interim=""
                  supported={supported}
                  error=""
                />
              </>
            ) : (
              <>
                <div className="rm-card rm-anim">
                  <div className="rm-card__head">
                    <h3 className="rm-card__title">Your interview</h3>
                    <span className="rm-chip">{effectiveSettings.type}</span>
                  </div>
                  <p className="rm-card__note">
                    Listen to your interviewer and answer out loud. Your feedback
                    appears below as the interview moves along.
                  </p>
                </div>

                <TranscriptPanel
                  lines={lines}
                  interim={interim}
                  supported={supported}
                  error={speechError}
                />
              </>
            )}

            <FeedbackPanel
              scores={displayScores}
              feedback={displayFeedback}
              isMock={displayIsMock}
            />

            {canFinish && (
              <button
                className="rm-btn rm-btn--primary rm-finish"
                onClick={finishAsInterviewer}
                disabled={answers.length === 0}
                title={
                  answers.length === 0
                    ? "Answer at least one question first"
                    : "Finish and see results"
                }
              >
                Finish Interview
              </button>
            )}

            <SessionInfo
              participantCount={participantCount}
              roomId={roomId}
              mode={effectiveSettings.mode}
              type={effectiveSettings.type}
              duration={`${effectiveSettings.duration} min`}
              connected={connected}
            />
          </aside>
        </main>
      )}
    </div>
  );
}

/*
 * Mode fork: AI sessions are solo — no lobby, no socket, no WebRTC.
 * Live sessions (human/friend) use the peer room below, unchanged.
 */
function InterviewRoom() {
  const location = useLocation();
  const settings = location.state?.settings ?? DEFAULT_SETTINGS;
  const questions = getQuestions(settings.type, settings.difficulty);

  if (settings.mode === "ai") {
    return <AiInterviewRoom settings={settings} questions={questions} />;
  }
  return <LiveInterviewRoom settings={settings} questions={questions} />;
}

export default InterviewRoom;
