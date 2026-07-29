import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Pages an owner can access even with an incomplete profile
const ALLOWED_INCOMPLETE_PATHS = new Set([
  "/owner/dashboard/profile",
  "/owner/profile",
  "/owner/payment-status",
  "/owner/feature-payment-status",
]);

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");
  const location = useLocation();

  const { ownerProfileComplete, ownerProfileLoading } = useContext(AuthContext);

  // 1. Not logged in → go to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Wrong role → go home
  if (role && role !== userRole) {
    return <Navigate to="/" replace />;
  }

  // 3. Owner profile check
  if (role === "OWNER" && userRole === "OWNER") {
    // Still fetching profile for the first time → render nothing (brief blank)
    if (ownerProfileLoading || ownerProfileComplete === null) {
      return null;
    }

    // Profile incomplete → redirect to profile setup page
    if (!ownerProfileComplete && !ALLOWED_INCOMPLETE_PATHS.has(location.pathname)) {
      return (
        <Navigate
          to="/owner/dashboard/profile"
          replace
          state={{ profileSetupRequired: true, from: location.pathname }}
        />
      );
    }
  }

  return children;
};

export default ProtectedRoute;