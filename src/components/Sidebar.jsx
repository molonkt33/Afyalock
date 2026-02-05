import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";

const Sidebar = () => {
  const role = localStorage.getItem("role");

  return (
    <div className="sidebar d-flex flex-column p-3">
      <h3 className="mb-4">MedVault</h3>
      <NavLink to="/dashboard" className="nav-link">
        Dashboard
      </NavLink>
      <NavLink to="/active-patients" className="nav-link">
        Active Patients
      </NavLink>
      <NavLink to="/patient-history" className="nav-link">
        Patient History
      </NavLink>
      {role === "admin" && (
        <NavLink to="/user" className="nav-link">
          User Management
        </NavLink>
      )}
    </div>
  );
};

export default Sidebar;
