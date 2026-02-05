import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import RoleGuard from "../components/RoleGuard";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-5">
        <h2 className="dashboard-title mb-4">Dashboard</h2>

        <div className="dashboard-cards row">
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm p-4">
              <h5>Total Patients</h5>
              <p>120</p>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm p-4">
              <h5>Active Patients</h5>
              <p>35</p>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm p-4">
              <h5>Staff Members</h5>
              <p>15</p>
            </div>
          </div>
        </div>

        <RoleGuard allowedRoles={["admin", "doctor"]}>
          <button className="btn btn-warning mt-3" onClick={() => alert("Admin action")}>
            Admin Action
          </button>
        </RoleGuard>
      </div>
    </div>
  );
};

export default Dashboard;
