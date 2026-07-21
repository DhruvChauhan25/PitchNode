import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeForRole } from "../utils/roleRoutes";

function Splash() {
  return (
    <div className="auth-splash">
      <span className="pn-node" aria-hidden="true" />
      <p>Loading…</p>
    </div>
  );
}

/* Requires any authenticated user. */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Splash />;
  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

/*
 * Requires one of `allow`. Client-side guards are UX, not security — the
 * backend enforces the same rules on every endpoint. This just prevents
 * showing a surface the user can't use.
 */
export function RoleRoute({ allow = [], children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Splash />;
  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!allow.includes(user.role))
    return <Navigate to={homeForRole(user.role)} replace />;
  return children;
}
