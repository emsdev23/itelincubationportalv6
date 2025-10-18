// ProtectedRoute.js
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const userId = sessionStorage.getItem("userid");
  const roleId = Number(sessionStorage.getItem("roleid"));

  // If not logged in → go to login page
  if (!userId) {
    return <Navigate to="/" replace />;
  }

  // If logged in but doesn't have permission → redirect properly
  if (allowedRoles.length > 0 && !allowedRoles.includes(roleId)) {
    // Redirect based on role
    if (roleId === 1 || roleId === 3 || roleId === 7) {
      return <Navigate to="/incubation/Dashboard" replace />;
    } else if (roleId === 4 || roleId === 1 || roleId === 3 || roleId === 7) {
      return <Navigate to="/startup/Dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // Access allowed
  return children;
};

export default ProtectedRoute;
