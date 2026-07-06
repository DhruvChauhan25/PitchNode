import { useEffect, useRef } from "react";

function VideoPanel({ stream, muted = true }) {
  const videoRef = useRef(null);

  useEffect(() => {
   console.log("VideoPanel stream:", stream);
  
   if (videoRef.current && stream) {
      console.log("Assigning srcObject to video element");
      videoRef.current.srcObject = stream;
    } 
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted = {muted}
      playsInline
      width="100%"
    />
  );
}

export default VideoPanel;