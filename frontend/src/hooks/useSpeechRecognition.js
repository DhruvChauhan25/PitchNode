import {useCallback, useEffect, useRef, useState} from "react";

const SpeechRecognition = 
    typeof window !== "undefined" 
        ? window.SpeechRecognition || window.webkitSpeechRecognition 
        : undefined;

const FATAL_ERRORS = new Set(["not-allowed", "audio-capture", "service-not-allowed"]);
const ERROR_MESSAGE_THRESHOLD = 3;

export default function useSpeechRecognition({ enabled }) {
    const supported = Boolean(SpeechRecognition);
    const [lines, setLines] = useState([]);
    const [interim, setInterim] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if(!supported || !enabled) return;

        let stopped = false;
        let fatal = false;
        let consecutiveErrors = 0;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        
        recognition.onresult = (event) => {
            consecutiveErrors = 0;
            setError("")

            let interimText = "";
            const finals = [];
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) finals.push(text.trim());
                else interimText += text;
            }
            if (finals.length > 0) setLines((prev) => [...prev, ...finals]);
            setInterim(interimText);
        };

        recognition.onerror = (event) => {
            console.warn("Speech recognition error:", event.error);

            if (FATAL_ERRORS.has(event.error)) {
                fatal = true;
                setError(
                    event.error === "audio-capture"
                        ? "No microphone detected."
                        : "Microphone access is blocked for this site."
                );
                return;
            } 
            

            if (event.error === "no-speech" || event.error === "aborted") return;

            consecutiveErrors += 1;

            if (consecutiveErrors >= ERROR_MESSAGE_THRESHOLD) {
                setError("Live transcription hit a problem and is reconnecting…");
            }
        };

        recognition.onend = () => {
            if (!stopped && !fatal) {
                try{
                    recognition.start();
                }
                catch(e) {
                    console.error("Speech recognition error:", e);
                }
            }
        };

        try {
            recognition.start();
        } catch(e) {
            console.error("Speech recognition error:", e);
        }

        return () => {
            stopped = true;
            recognition.onend = null;
            recognition.onresult = null;
            recognition.onerror = null;
            try {
                recognition.stop();
            }
            catch(e) {
                console.error("Speech recognition error:", e);
            }
            setInterim("");
        };
    }, [enabled, supported]);

    const reset = useCallback(() => {
        setLines([]);
        setInterim("");
    }, []);

    return { supported, lines, interim, transcript: lines.join(" "), error, reset };   
            
}