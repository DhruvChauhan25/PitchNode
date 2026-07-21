import axios from 'axios';

const BASE = import.meta.env.VITE_INTERVIEW_API_URL || 'http://localhost:8000';

// "Technical" | "Behavioral" | "HR" => "technical" | "behavioral" | "hr"
const toApiType = (type) => String(type).toLowerCase();

const USER_ID_KEY = "user_id";

export function getUserId() {
    try{
        let id = localStorage.getItem(USER_ID_KEY);
        if(!id) {
            id = typeof crypto !== "undefined" && crypto.randomUUID 
                ? crypto.randomUUID()
                : `u_${Date.now()}_${Math.random().toString(36).slice(2)}`;  
            localStorage.setItem(USER_ID_KEY, id);
        }
        return id;
    } catch {
        return `u_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }
}

export const healthApi = () => axios.get(`${BASE}/`);

export const startSessionApi = (interviewType) => 
    axios.post(`${BASE}/session/start`, {
        interview_type: toApiType(interviewType),
        user_id: getUserId(),
    });

export const getSessionApi = (sessionId) => 
    axios.get(`${BASE}/session/${sessionId}`);

export const getRubricApi = (interviewType) => 
    axios.get(`${BASE}/rubric/${toApiType(interviewType)}`);

export const startQuestionsApi = (sessionId) =>
    // axios.post(`${BASE}/session/${sessionId}/start`);
    axios.post(`${BASE}/session/start`);

export const nextQuestionApi = (sessionId) =>
    axios.get(`${BASE}/questions/${sessionId}/next`);

export const markAnsweredApi = (sessionId, questionId) =>
  axios.post(`${BASE}/questions/${sessionId}/answered/${questionId}`);

export const evaluateAnswerApi = ({ sessionId, questionId, questionText, transcript }) =>
  axios.post(`${BASE}/evaluations`, {
    session_id: sessionId,
    question_id: questionId,
    question_text: questionText,
    transcript,
  });

/* results + history */
export const completeSessionApi = (sessionId) =>
  axios.post(`${BASE}/session/${sessionId}/complete`);

export const getResultsApi = (sessionId) =>
  axios.get(`${BASE}/session/${sessionId}/results`);

export const getHistoryApi = () =>
  axios.get(`${BASE}/sessions`, { params: { user_id: getUserId() } });