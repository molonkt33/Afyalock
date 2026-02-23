import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute component
 * @param {ReactNode} children - Component(s) to render if authorized
 * @param {Array} allowedRoles - Optional array of roles allowed to access this route
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // 🔐 Function to validate JWT token expiration
  const isTokenValid = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (!payload.exp) return false;

      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  };

  // 1️⃣ If no token or invalid token → force logout
  if (!token || !isTokenValid(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  // 2️⃣ If route has role restriction → enforce role-based access
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3️⃣ Authorized
  return children;
};

export default ProtectedRoute;
