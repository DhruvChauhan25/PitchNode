/*
 * Mock evaluation service — TEMPORARY.
 * Response shape matches POST /evaluations in docs/api-requirements.md
 * exactly, so swapping this for the real call is a one-line change in
 * AiInterviewRoom. Scores vary with the question and how long you spoke,
 * so repeated demo answers don't return identical numbers.
 */

const PRAISE = [
  "Good structure overall.",
  "Clear and steady delivery.",
  "Strong opening that framed the answer well.",
  "Solid grasp of the fundamentals.",
  "Concise and to the point.",
];

const IMPROVEMENT = {
  communication:
    "Try the STAR structure — situation, task, action, result — to keep answers organized.",
  technicalAccuracy:
    "Back claims with a concrete example or trade-off to strengthen technical accuracy.",
  confidence:
    "Slow down slightly and reduce filler words to sound more confident.",
  problemSolving:
    "Walk through your reasoning step by step before jumping to the solution.",
};

export function mockEvaluate({ questionIndex, answerSeconds, transcriptLength }) {
  const seed = 
  (questionIndex + 1) * 31 + 
    Math.min(answerSeconds, 180) * 7 + 
    Math.min(transcriptLength, 1200);
  const score = (k) =>
    68 + Math.floor(Math.abs(Math.sin(seed + k * 3.7)) * 28);

  const scores = {
    communication: score(1),
    technicalAccuracy: score(2),
    confidence: score(3),
    problemSolving: score(4),
  };

  const lowest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0];
  const feedback = `${PRAISE[seed % PRAISE.length]} ${IMPROVEMENT[lowest]}`;

  return { scores, feedback };
}
