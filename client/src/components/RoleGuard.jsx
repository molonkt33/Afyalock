import React from "react";
import { Navigate } from "react-router-dom";

/**
 * RoleGuard component
 * @param {ReactNode} children - Elements/components to render if authorized
 * @param {Array} allowedRoles - Roles allowed to view the children
 */
const RoleGuard = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  let role = localStorage.getItem("role") || "";
  role = role.toLowerCase();

  // 🚫 Not logged in or no token
  if (!token) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    return <Navigate to="/login" replace />;
  }

  // 🔓 If no specific role restriction → allow
  if (!allowedRoles) {
    return <>{children}</>;
  }

  // ✅ If role allowed → render (normalize allowed list)
  const normalized = allowedRoles.map(r => r.toLowerCase());
  if (normalized.includes(role)) {
    return <>{children}</>;
  }

  // ❌ Role not allowed
  return <Navigate to="/dashboard" replace />;
};

export default RoleGuard;