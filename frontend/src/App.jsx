import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/auth.css"

import Landing from "./pages/Landing";
import InterviewRoom from "./pages/InterviewRoom";
import InterviewSetup from "./pages/interviewSetup";
import Results from "./pages/Results";

import Login from "./pages/Login";
import Register from "./pages/Register";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, RoleRoute } from "./components/RouteGuards";
import { ROLES } from "./api/authApi";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/setup"
              element={
                <ProtectedRoute>
                  <InterviewSetup />
                </ProtectedRoute>
              }
            />

            <Route
              path="/room"
              element={
                <ProtectedRoute>
                  <InterviewRoom />
                </ProtectedRoute>
              }
            />

            <Route
              path="/results"
              element={
                <ProtectedRoute>
                  <Results />
                </ProtectedRoute>
              }
            />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>


    // <BrowserRouter>
    //   <Routes>
    //     <Route path="/" element={<Landing />} />
    //     <Route path="/room" element={<InterviewRoom />} />
    //     <Route path="/setup" element={<InterviewSetup />} />
    //     <Route path="/results" element={<Results />} />
    //     <Route path="*" element={<Navigate to="/" replace />} />
    //   </Routes>
    // </BrowserRouter>
  );
}

export default App;