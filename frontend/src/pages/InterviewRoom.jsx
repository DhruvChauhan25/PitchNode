import {useEffect, useState, useRef, useSyncExternalStore} from "react";
import {io} from "socket.io-client";

import {createRoomApi, checkRoomApi} from "../api/sessionApi";
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
import useLocalMedia from "../hooks/useLocalMedia";
import usePeerConnection from "../hooks/usePeerConnection";
import "../styles/room.css";

function formatElapsed(totalSeconds){
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${m}:${s}`;
}

function InterviewRoom() {
    const [createdRoomId, setCreatedRoomId] = useState("");
    const [roomId, setRoomId] = useState(
        () => new URLSearchParams(window.location.search).get("roomId") || ""
    );
    const [participantCount, setParticipantCount] = useState(0);
    const [joined, setJoined] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [participantJoinedSignal, setParticipantJoinedSignal] = useState(0);
    const [error, setError] = useState("");

    const [elapsed, setElapsed] = useState(0);
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [sharing, setSharing] = useState(false);
    const [copied, setCopied] = useState(false);

    const screentrackRef = useRef(null);
    const socketRef = useRef(null);

    if (!socketRef.current) {
        socketRef.current = io("http://localhost:5001");
    }
    const socket = socketRef.current;

    const localStream = useLocalMedia();
    const {peerConnectionRef, remoteStream} = usePeerConnection({socket, roomId, localStream});

    useEffect(() => {
        socket.on("participant-count", (count) => {
            setParticipantCount(count);
        });

        socket.off("participant-joined");
        socket.on("participant-joined", () => {
            setParticipantJoinedSignal((prev) => prev + 1);
        });

        return () => {
            socket.off("participant-count");
            socket.off("participant-joined");
        };
    }, [socket]);

    useEffect(() => {
        if (!isHost || participantJoinedSignal === 0 || !localStream) return;

        const pc = peerConnectionRef.current;
        if (!pc) return;

        let cancelled = false;

        (async () => {
            const offer = await pc.createOffer();
            if (cancelled) return;
            await pc.setLocalDescription(offer);
            socket.emit("offer", {roomId, offer});
        })();

        return () => { cancelled = true; };
    }, [isHost, participantJoinedSignal, localStream, roomId]);

    const connected = useSyncExternalStore(
        (notify) => {
            socket.on("connect", notify);
            socket.on("disconnect", notify);
            return () => {
                socket.off("connect", notify);
                socket.off("disconnect", notify);
            };
        },
        () => socket.connected
    )

    useEffect(() => {
        if(!joined) return;

        const id = setInterval(() => {
            setElapsed((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(id);
    }, [joined]);

    const createRoom = async () => {
        try {
            const response = await createRoomApi();
            const newRoomId = response?.data?.roomId;

            setCreatedRoomId(newRoomId);
            setRoomId(newRoomId);
            setIsHost(true);
            setJoined(true);
            setElapsed(0);

            socket.emit("join-session", newRoomId);
        } catch (err) {
            console.error("Error creating room:", err);
            setError("Failed to create room. Please try again. Is the session service running?");
        }
    };

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
            setError("Failed to join room. Please try again.");
        }
    };

    const leaveRoom = () => {
        if (!roomId) {
            setError("No Room ID found. Cannot leave room.");
            return;
        }

        if(sharing) stopScreenShare();

        socket.emit("leave-session", roomId);

        setJoined(false);
        setIsHost(false);
        setCreatedRoomId("");
        setRoomId("");
        setParticipantCount(0);

        /* Re-enable local tracks so the next session starts clean */
        localStream?.getAudioTracks().forEach((t) => (t.enabled = true));
        localStream?.getVideoTracks().forEach((t) => (t.enabled = true));
        setMicOn(true);
        setCamOn(true);
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
        const sender = peerConnectionRef.current?.getSenders().find((s) => s.track && s.track.kind === "video");
        
        if (sender && camTrack) 
            sender.replaceTrack(camTrack);

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

            if (sender) 
                await sender.replaceTrack(track);

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

        try{
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy room link:", err);
        }
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
        </div>

        <div className="room-header__group">
          <span className="rm-badge">
            {participantCount} participant{participantCount === 1 ? "" : "s"}
          </span>
          {joined && <span className="rm-timer">{formatElapsed(elapsed)}</span>}
          {joined && (
            <button className="rm-btn rm-btn--outline" onClick={copyRoomLink}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Copied" : "Copy link"}
            </button>
          )}
          {joined && (
            <button className="rm-btn rm-btn--danger" onClick={leaveRoom}>
              Leave interview
            </button>
          )}
        </div>
      </header>

      {!joined ? (
        <main className="room-lobby">
          <RoomControls
            roomId={roomId}
            setRoomId={setRoomId}
            createdRoomId={createdRoomId}
            error={error}
            createRoom={createRoom}
            joinRoom={joinRoom}
            copyRoomLink={copyRoomLink}
            copied={copied}
          />
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
              <span className="rm-video__label">Interviewer</span>

              <div className="rm-video rm-video--pip">
                <VideoPanel stream={localStream} muted mirrored />
                <span className="rm-video__label">You</span>
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
                onClick={leaveRoom}
                aria-label="Leave interview"
              >
                <LeaveIcon />
                Leave
              </button>
            </div>
          </section>

          <aside className="room-side">
            <QuestionPanel />
            <TranscriptPanel />
            <FeedbackPanel />
            <SessionInfo
              participantCount={participantCount}
              roomId={roomId}
              connected={connected}
            />
          </aside>
        </main>
      )}
    </div>
  );
}

export default InterviewRoom;
