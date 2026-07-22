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
import { ProtectedRoute, RoleRoute } from "./components/RouteGuards.jsx";
import { ROLES } from "./api/authApi";
import AdminPanel from "./pages/AdminPanel";
import ExpertDashboard from "./pages/ExpertDashboard.jsx";
import PendingApproval from "./pages/PendingApproval.jsx";
import RequestInterview from "./pages/RequestInterview.jsx";
import MyRequests from "./pages/MyRequests.jsx";


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

            <Route 
              path="/admin"
              element={
                <RoleRoute allow={[ROLES.ADMIN]}>
                <AdminPanel />
              </RoleRoute>
              }
            />

            <Route
              path="/expert"
              element={
                <RoleRoute allow={[ROLES.EXPERT]}>
                  <ExpertDashboard />
                </RoleRoute>
              }
            />

            <Route
              path="/pending"
              element={
                <ProtectedRoute >
                  <PendingApproval />
                </ProtectedRoute>
              }
            />

            <Route
              path="/request"
              element={
                <ProtectedRoute>
                  <RequestInterview />
                </ProtectedRoute>
              }
            />

            <Route
              path="/requests"
              element={
                <ProtectedRoute>
                  <MyRequests />
                </ProtectedRoute>
              }
            />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;