import { useEffect, useRef } from "react";

function VideoPanel({ stream }) {
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
      muted
      playsInline
      width="100%"
    />
  );
}

export default VideoPanel;