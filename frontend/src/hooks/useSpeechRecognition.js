import {useCallback, useEffect, useState} from "react";

const SpeechRecognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;

export default function useSpeechRecognition({ enabled }) {
    const supported = Boolean(SpeechRecognition);
    const [lines, setLines] = useState([]);
    const [interim, setInterim] = useState("");

    useEffect(() => {
        if(!supported || !enabled) return;

        let stopped = false;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        
        recognition.onresult = (event) => {
            let interimText = "";
            const finals = {};
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) finals.push(text.trim());
                else interimText += text;
            }
            if (finals.length > 0) setLines((prev) => [...prev, ...finals]);
            setInterim(interimText);
        };

        recognition.onend = () => {
            if (!stopped) {
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
        }
        catch(e) {
            console.error("Speech recognition error:", e);
        }

        return () => {
            stopped = true;
            recognition.onend = null;
            recognition.onresult = null;
            try {
                recognition.stop();
            }
            catch(e) {
                console.error("Speech recognition error:", e);
            }
            setInterim("");
        };
    }, [enabled, supported]);

    return { supported, lines, interim, transcript: lines.join(" ")};   
            
}