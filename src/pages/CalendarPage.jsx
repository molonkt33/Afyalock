import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ActivePatients.css";

function CalendarPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Role-based access for Calendar:
  // - Admin, Doctor: Full access (view, manage appointments)
  // - Receptionist: Manage appointments & outpatient records (view, add, edit)
  // - Nurse, Lab, Radiology, Emergency: View only
  const canViewCalendar = ["admin", "doctor", "reception", "nurse", "lab", "radiology", "emergency"].includes(role);
  const canManageAppointments = ["admin", "doctor", "reception"].includes(role);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Access denied check
  if (!canViewCalendar) {
    return (
      <div className="d-flex">
        <div className="flex-grow-1 p-5">
          <div className="dashboard-card">
            <div className="access-denied">
              <i className="fa-solid fa-lock"></i>
              <h3>Access Denied</h3>
              <p>You don't have permission to view the calendar.</p>
              <p className="role-info">Contact your administrator for access.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <div className="flex-grow-1 p-5">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Appointments Calendar</h2>
            {canManageAppointments ? (
              <button className="primary-btn">
                <i className="fa-solid fa-plus"></i> Add Appointment
              </button>
            ) : (
              <button className="primary-btn" disabled title="Insufficient permissions">
                <i className="fa-solid fa-plus"></i> Add Appointment
              </button>
            )}
          </div>

          <div className="calendar-placeholder">
            Calendar UI will integrate here (Google API)
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
