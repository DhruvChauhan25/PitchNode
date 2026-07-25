import { useCallback, useEffect, useRef, useState } from "react";
import { 
    generateQuestionsApi, 
    markAnsweredApi, 
    startQuestionsApi, 
    startSessionApi,
    evaluateAnswerApi,
    completeSessionApi
} from "../api/interviewApi";

export default function useLiveSession({settings, isHost, enabled = true}) {
    const [sessionId, setSessionId] = useState("");
    const [serverQuestions, setServerQuestions] = useState(null);
    const [scores, setScores] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [scoring, setScoring] = useState(false);
    const [answers, setAnswers] = useState([]);

    const startedRef = useRef(false);

    const apiMode = sessionId != "" && sessionId !== "OFFLINE";

    useEffect(() => {
        if(!enabled || !isHost || startedRef.current)
            return;

        startedRef.current = true;

        (async () => {
            try{
                const res = await startSessionApi(settings.type, {
                    difficulty: settings.difficulty,
                    duration: settings.duration,
                    mode: settings.mode,
                    cvId: settings.cvId || null,
                    jdId: settings.jobDescriptionId || null,
                });
                const id = res?.data?.id;
                if (!id) throw new Error("Session response missing id");

                //tailored question when cv/jd is present
                if(settings.cvId || settings.jobDescriptionId){
                    try{
                        const gen = await generateQuestionsApi({
                            interviewType: settings.type,
                            cvId: settings.cvId || null,
                            jdId: settings.jobDescriptionId || null,
                            count: settings.duration/3 || 5,
                        })

                        if(Array.isArray(gen?.data) && gen.data.length) {
                            setServerQuestions(
                                gen.data.map((q) => q.prompt ?? q.text ?? "").filter(Boolean)
                            );
                        }
                    } catch (err) {
                        console.warn("Tailored generation unavailable for live room.", err);
                    }
                }

                try{
                    await startQuestionsApi(id);
                } catch (err) {
                    console.warn("Question seeding failed for live room.", err);
                }
                
                setSessionId(id);
            } catch(err){
                console.warn("Live session unavailable — running locally.", err);
                setSessionId("OFFLINE");
            }
        })();
    }, [enabled, isHost, settings])

    const evaluateAnswer = useCallback(
        async({questionIndex, questionText, transcript, mockEvaluate}) => {
           setScoring(true);
           let result;
           try{
            if(apiMode && transcript?.trim()) {
                const res = await evaluateAnswerApi({
                    sessionId,
                    questionId: `q${questionIndex + 1}`,
                    questionText,
                    transcript,
                });
                result = res?.data;
            } else {
                throw new Error("offline-or-empty")
            }
            } catch {    
                result = mockEvaluate
                ? mockEvaluate({
                    questionIndex,
                    answerSeconds: 10,
                    transcriptLength: (transcript || "").length,
                    })
                : null;
            } finally {
                setScoring(false);
            }

            if(result){
                setScores(result?.scores);
                setFeedback(result.feedback);
                setAnswers((prev) => [
                    ...prev.filter((a) => a.index !== questionIndex),
                    {
                        index: questionIndex,
                        question: questionIndex,
                        transcript,
                        ...result,
                    },
                ]);
                if(apiMode){
                    markAnsweredApi(sessionId, `q${questionIndex + 1}`).catch(() => {});
                }
            }
            return result;
        }, [apiMode, sessionId]
    );

    const clearScores = useCallback(() => {
        setScores(null);
        setFeedback("");
    }, [])

    const completeSession = useCallback(async () => {
        if(!apiMode)
            return null;

        try{
            const res = await completeSession(sessionId);
            return res?.data ?? null;
        } catch {
            return null;
        }
    }, [apiMode, sessionId])

    return{
        sessionId,
        apiMode,
        serverQuestions,
        scores,
        feedback,
        scoring,
        answers,
        evaluateAnswer,
        clearScores,
        completeSession,
    };
}