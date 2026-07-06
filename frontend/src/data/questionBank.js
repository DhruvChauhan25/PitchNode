export const INTERVIEW_TYPES = ["Technical", "Behavioral", "HR"];
export const DIFFICULTIES = ["Easy", "Medium", "Hard"];
export const DURATIONS = [15, 30, 45];

export const QUESTION_BANK = {
  Technical: {
    Easy: [
      "What is the difference between HTTP GET and POST requests?",
      "Explain what an API is, as if to a non-technical person.",
      "What is the difference between an array and a linked list?",
    ],
    Medium: [
      "Explain the difference between REST and WebSocket communication. When would you choose one over the other?",
      "How does a load balancer help a distributed system scale?",
      "Walk through what happens when you type a URL into a browser and press Enter.",
    ],
    Hard: [
      "Design a signaling flow for a WebRTC peer-to-peer video call. What race conditions can occur?",
      "How would you keep session state consistent across multiple backend instances?",
      "Explain the CAP theorem and how it influences database choice in a real system.",
    ],
  },
  Behavioral: {
    Easy: [
      "Tell me about a project you are proud of and your role in it.",
      "Describe a time you had to learn a new technology quickly.",
      "How do you prioritize tasks when everything feels urgent?",
    ],
    Medium: [
      "Tell me about a time you disagreed with a teammate. How did you resolve it?",
      "Describe a situation where a project was falling behind schedule. What did you do?",
      "Tell me about a time you received difficult feedback and how you responded.",
    ],
    Hard: [
      "Describe a time you made a significant mistake in production. How did you handle it and what changed afterward?",
      "Tell me about a time you had to influence a decision without having authority.",
      "Describe the hardest trade-off you have made between quality and a deadline.",
    ],
  },
  HR: {
    Easy: [
      "Tell me about yourself and what you are looking for in your next role.",
      "What motivates you to do your best work?",
      "Why are you interested in this position?",
    ],
    Medium: [
      "Where do you see yourself in five years, and how does this role fit that path?",
      "What are your greatest strengths and one area you are actively improving?",
      "Why are you leaving (or why did you leave) your current position?",
    ],
    Hard: [
      "Walk me through a gap or transition in your career and what you took away from it.",
      "What would your previous manager say is your biggest weakness?",
      "You have competing offers. What factors will decide your choice, and where do we fall short?",
    ],
  },
};

export function getQuestions(type, difficulty) {
  return (
    QUESTION_BANK[type]?.[difficulty] ?? QUESTION_BANK.Technical.Medium
  );
}
