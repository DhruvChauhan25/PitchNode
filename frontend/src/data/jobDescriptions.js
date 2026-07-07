/*
 * Preset job descriptions — mirrors the GET /job-descriptions response shape
 * from docs/api-requirements.md so this file swaps for the API call directly.
 */

export const JOB_DESCRIPTIONS = [
  {
    id: "jd_sde1",
    title: "Software Engineer I",
    company: "Generic Tech Co",
    summary:
      "Build and maintain backend services and REST APIs. Node.js or Java, SQL, and cloud fundamentals. Emphasis on data structures and system design basics.",
  },
  {
    id: "jd_frontend",
    title: "Frontend Developer",
    company: "Product Startup",
    summary:
      "React, state management, performance, and accessibility. Ship polished UI in a fast-moving team with design collaboration.",
  },
  {
    id: "jd_data_analyst",
    title: "Data Analyst",
    company: "Health Analytics Inc",
    summary:
      "SQL, Python, dashboarding, and stakeholder communication. Turn messy healthcare data into decisions.",
  },
  {
    id: "jd_ml_intern",
    title: "Machine Learning Intern",
    company: "AI Research Lab",
    summary:
      "Model training and evaluation, Python, PyTorch or TensorFlow, and strong ML fundamentals. Research mindset preferred.",
  },
  {
    id: "jd_fullstack",
    title: "Full-Stack Developer",
    company: "Enterprise SaaS Co",
    summary:
      "End-to-end features across React and Node.js with MongoDB. WebSocket experience and API design are a plus.",
  },
];
