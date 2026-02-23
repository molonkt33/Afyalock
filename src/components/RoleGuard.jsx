// src/components/RoleGuard.jsx
import React from "react";

/**
 * RoleGuard component
 * @param {ReactNode} children - Elements/components to render if authorized
 * @param {Array} allowedRoles - Roles allowed to view the children
 */
const RoleGuard = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // 🔐 Validate JWT expiration
  const isTokenValid = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (!payload.exp) return false;

      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  };

  // If no valid session → render nothing
  if (!token || !isTokenValid(token)) {
    return null;
  }

  // If no role restriction → render normally
  if (!allowedRoles) {
    return <>{children}</>;
  }

  // If role allowed → render
  if (allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  // Otherwise → hide content
  return null;
};

export default RoleGuard;
