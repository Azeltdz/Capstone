// src/components/ProtectedRoute.jsx
//
// Wraps a page and redirects to login if there's no logged-in user,
// or if the logged-in user's role isn't allowed on this route.
// This is the client-side mirror of the requireRole() middleware
// already built on the backend — the backend is still the real
// enforcement, this just keeps the UI from showing a screen the
// user has no business seeing.

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in, but wrong role for this route — send them to
    // their own dashboard instead of showing an empty/broken page.
    return <Navigate to={user.role === "owner" ? "/owner" : "/cashier"} replace />;
  }

  return children;
}
