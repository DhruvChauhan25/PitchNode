import { useEffect, useRef } from "react";

function VideoPanel({ stream, muted = true, mirrored = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={muted}
      playsInline
      className={`rm-video__el${mirrored ? " rm-video__el--mirror" : ""}`}
    />
  );
}

export default VideoPanel;