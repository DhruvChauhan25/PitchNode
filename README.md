## PitchNode

An AI-powered mock interview platform. Practice interviews three ways: 
solo with an AI interviewer, 
live with a human expert, 
or live with a friend acting as prompter — all scored against a rubric.


## Project Structure

```text
PitchNode/
├── frontend/                   React + Vite (Vercel)
├── session-service/            Node + Express + Socket.IO — WebRTC signaling, live rooms (Render)
├── evaluation-service/         Python + FastAPI — auth, sessions, questions, Groq-based evaluation (Render)
└── README.md
```

## Installation

### Clone the Repository

```bash
git clone https://github.com/PitchNode-Team/PitchNode.git
cd PitchNode
```

### Frontend

```bash
cd frontend
npm install
```

### Session Service

```bash
cd session-service
npm install
```

### Evaluation Service

```bash
cd evaluation-service
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Running the Application

### Start Session Service (Node/Socket.IO)

```bash
cd session-service
node server.js
```

Runs on:

```text
http://localhost:5001
```

### Start Evaluation Service  (FastAPI, Python)

```bash
cd evaluation-service
uvicorn app.main:app --reload --port 8000
```

Runs on:

```text
http://localhost:8000
```

### Start Frontend

```bash
cd frontend
npm run dev
```

Runs on:

```text
http://localhost:5173
```

## Current Status

### Completed

* Auth (register/login/JWT), role-based routing (user / expert / admin)
* Room 1 — AI interviewer: tailored question generation from CV/JD/Duration/Difficulty, live speech-to-text, Groq-based rubric scoring, results dashboard
* Room 2 — live interview with a human expert: request/accept flow, WebRTC video, real-time question sync
* Room 3 — live interview with a friend as prompter: same WebRTC/Socket.IO session as Room 2, peer drives navigation, candidate is evaluated
* Real-time signaling over Socket.IO (WebRTC offer/answer/ICE, question sync, live transcript relay, session completion handoff)
* CV/JD upload and reuse (saved documents, system JD presets)
* Session history with per-session results
* Deployed: frontend on Vercel, both backend services on Render

### Known Limitations
* AI-generated interview questions are generated on demand and are not permanently stored for reuse.
* The Human Expert interview workflow currently allows candidates to submit interview requests, but the expert-side acceptance, rejection, and scheduling workflow is not yet available.
* The Admin dashboard is partially implemented and currently provides limited management functionality.


### Possible future work

* Persist dynamically generated interview questions for analytics and replay.
* Add calendar integration and automated interview scheduling.
* Expand the expert dashboard with review, moderation, and analytics tools.
