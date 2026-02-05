// src/components/RoleGuard.jsx
import React from "react";

/**
 * RoleGuard component
 * @param {ReactNode} children - The elements/components to render if authorized
 * @param {Array} allowedRoles - Array of roles allowed to see the children
 */
const RoleGuard = ({ children, allowedRoles }) => {
  const role = localStorage.getItem("role");

  if (!allowedRoles || allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  // If user role is not allowed, render nothing
  return null;
};

export default RoleGuard;
