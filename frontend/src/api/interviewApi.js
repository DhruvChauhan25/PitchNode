import axios from 'axios';
import { authedClient } from './authApi';

const BASE = import.meta.env.VITE_INTERVIEW_API_URL || 'http://localhost:8000';

// "Technical" | "Behavioral" | "HR" => "technical" | "behavioral" | "hr"
const toApiType = (type) => String(type).toLowerCase();

export const healthApi = () => authedClient.get('/');

//create the session 
//user_id comes from the JWT

export const startSessionApi = (interviewType, opts = {}) =>
  authedClient.post(`/session/start`, {
    interview_type: toApiType(interviewType),
    ...(opts.difficulty ? { difficulty: String(opts.difficulty).toLowerCase() } : {}),
    ...(opts.duration ? { duration: opts.duration } : {}),
    ...(opts.mode ? { mode: opts.mode } : {}),
    ...(opts.cvId ? { cv_id: opts.cvId } : {}),
    ...(opts.jdId ? { jd_id: opts.jdId } : {}),
  });

export const getSessionApi = (sessionId) =>
  authedClient.get(`/session/${sessionId}`);

export const getRubricApi = (interviewType) =>
  authedClient.get(`/rubric/${toApiType(interviewType)}`);

//seed questions for this session
//path param onlt, no nody
export const startQuestionsApi = (sessionId) =>
  authedClient.post(`/questions/${sessionId}/start`);

//fetch the next unanswered question
export const nextQuestionApi = (sessionId) =>
  authedClient.get(`/questions/${sessionId}/next`);

export const markAnsweredApi = (sessionId, questionId) =>
  authedClient.post(`/questions/${sessionId}/answered/${questionId}`);

export const evaluateAnswerApi = ({ sessionId, questionId, questionText, transcript }) =>
  authedClient.post(`/evaluations`, {
    session_id: sessionId,
    question_id: questionId,
    question_text: questionText,
    transcript,
  });

// results + history 
export const completeSessionApi = (sessionId) =>
  authedClient.post(`/session/${sessionId}/complete`);

export const getResultsApi = (sessionId) =>
  authedClient.get(`/session/${sessionId}/results`);

// GET /sessions, 
// user taken from JWT (no user_id param).
export const getHistoryApi = () => authedClient.get(`/sessions`);

export const generateQuestionsApi = ({ 
  interviewType, 
  difficulty,
  cvId, 
  jdId, 
  duration,

}) => {
  // number of questions, based on duration
  // approx 6 minutes for 1 question
  const interviewDuration = Number(duration) || 15;
  const count = Math.max(3, Math.round(interviewDuration / 6));

  const params = new URLSearchParams({ 
    interview_type: toApiType(interviewType),
    difficulty: difficulty.toLowerCase(),
    count: String(count), 
  });

  if (cvId) params.set("cv_id", cvId);
  if (jdId) params.set("jd_id", jdId);

  return authedClient.post(`/questions/generate?${params.toString()}`);
};