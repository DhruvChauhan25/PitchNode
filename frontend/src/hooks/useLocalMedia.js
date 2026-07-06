import {useEffect, useState} from 'react';
import {getLocalStream, stopLocalStream} from '../webrtc/media';

export default function useLocalMedia() {
  const [localStream, setLocalStream] = useState(null);
  
  useEffect(() => {
    let stream;

    const startMedia = async () => {
      try {
        stream = await getLocalStream();
        setLocalStream(stream);
        // addLocalStream(stream);

        console.log('Local media stream started:', stream);
      } catch (error) {
        console.error('Error accessing local media:', error);
      }
    };

    startMedia();

    return () => {
      if (stream) {
        stopLocalStream(stream);
        console.log('Local media stream stopped');
      }
    };
  }, []);

  return localStream;
}   