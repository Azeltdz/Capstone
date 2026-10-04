import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeFor, loginPathFor } from "../constants/routes";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to={loginPathFor(allowedRoles)} replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Signed in, but wrong role for this area: send them to their own home.
    return <Navigate to={homeFor(user.role)} replace />;
  }

  return children;
}