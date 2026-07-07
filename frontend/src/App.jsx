import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import Landing from "./pages/Landing";
import InterviewRoom from "./pages/InterviewRoom";
import InterviewSetup from "./pages/interviewSetup";
import Results from "./pages/Results";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room" element={<InterviewRoom />} />
        <Route path="/setup" element={<InterviewSetup />} />
        <Route path="/results" element={<Results />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;