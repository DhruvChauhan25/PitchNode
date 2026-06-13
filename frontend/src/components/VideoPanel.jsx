import { useEffect, useRef } from "react";

function VideoPanel() {
  const videoRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

        videoRef.current.srcObject = stream;
      } catch (err) {
        console.log(err);
      }
    };

    startCamera();
  }, []);

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