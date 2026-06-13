## Project Structure

```text
PitchNode/
├── frontend/
├── session-service/
├── evaluation-service/
└── README.md
```

## Installation

### Clone the Repository

```bash
git clone https://github.com/DhruvChauhan25/PitchNode.git
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
npm install
```

## Running the Application

### Start Session Service

```bash
cd session-service
node server.js
```

Runs on:

```text
http://localhost:5001
```

### Start Evaluation Service

```bash
cd evaluation-service
node server.js
```

Runs on:

```text
http://localhost:5002
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

* React frontend setup
* Session service setup
* Evaluation service setup
* Socket.IO integration
* Real-time room joining
* Participant count tracking
* Webcam preview

### Upcoming Features

* Room creation API
* Room validation
* WebRTC video communication
* AI interview evaluation
* Docker Compose deployment
