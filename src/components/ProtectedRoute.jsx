// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute component
 * @param {ReactNode} children - The component(s) to render if authorized
 * @param {Array} allowedRoles - Optional array of roles allowed to access this route
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // 1️⃣ If user is not logged in, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2️⃣ If route has role restriction, check user role
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3️⃣ User is authorized
  return children;
};

export default ProtectedRoute;
