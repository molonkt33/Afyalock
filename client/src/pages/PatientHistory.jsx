
import React, { useEffect, useState } from "react";
import { getInitials } from "../utils/getInitials";
import { useNavigate } from "react-router-dom";
import "../styles/ActivePatients.css";

function PatientHistory() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("card");
  const [showMenu, setShowMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [starredPatients, setStarredPatients] = useState([]);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  // Role-based access: admin, doctor, nurse can view patient history
  const canViewHistory = ["admin", "doctor", "nurse"].includes(role);
  const canRemovePatient = ["admin", "doctor"].includes(role);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Check role permission
    if (!canViewHistory) {
      setLoading(false);
      return;
    }

    setLoading(true);
    import("../services/api").then(({ default: api }) => {
      api
        .get("/patients/history")
        .then(({ data }) => {
          if (Array.isArray(data)) {
            setHistory(data);
          } else if (data.data && Array.isArray(data.data)) {
            setHistory(data.data);
          } else {
            setHistory([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching patient history:", err);
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("user");
            navigate("/login");
          }
          setHistory([]);
        })
        .finally(() => setLoading(false));
    });
  }, [token, navigate, canViewHistory]);

  const filtered = history.filter((patient) =>
    patient.fullName?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const aStarred = starredPatients.includes(a.id || a._id);
    const bStarred = starredPatients.includes(b.id || b._id);
    if (aStarred && !bStarred) return -1;
    if (!aStarred && bStarred) return 1;
    return 0;
  });

  const getHistoryEventDate = (patient) => patient.dischargeDate || patient.deletedAt;
  const getHistoryStatus = (patient) => {
    if (patient.deletedAt) return "Removed";
    if (patient.dischargeDate) return "Discharged";
    return "Unknown";
  };

  // Handle star/favorite patient
  const handleStarPatient = (patientId) => {
    if (starredPatients.includes(patientId)) {
      setStarredPatients(starredPatients.filter(id => id !== patientId));
    } else {
      setStarredPatients([...starredPatients, patientId]);
    }
    setShowMenu(null);
  };

  // Handle view patient details
  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
    setShowMenu(null);
  };

  // Handle remove patient record
  const handleRemovePatient = async (patientId) => {
    if (!window.confirm("Are you sure you want to remove this record?")) {
      setShowMenu(null);
      return;
    }

    try {
      const { default: api } = await import("../services/api");
      await api.delete(`/patients/${patientId}`);
      setHistory(history.filter(p => (p.id || p._id) !== patientId));
      alert("Record removed successfully");
    } catch (err) {
      console.error("Error removing record:", err);
      alert(err.response?.data?.message || "Failed to remove record");
    } finally {
      setShowMenu(null);
    }
  };

  // If user doesn't have permission
  if (!canViewHistory) {
    return (
      <div className="d-flex">
        <div className="flex-grow-1 p-5">
          <div className="access-denied">
            <i className="fa-solid fa-lock"></i>
            <h3>Access Denied</h3>
            <p>You don't have permission to view patient history.</p>
            <p className="role-info">Required roles: Administrator, Doctor, or Nurse</p>
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
            <h2>Patient History</h2>
            <span className="record-count">History Records</span>
          </div>

          <div className="controls">
            <input
              className="search-bar"
              placeholder="Search by patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="view-toggle">
              <button 
                className={`view-toggle-btn ${view === "card" ? "active" : ""}`}
                onClick={() => setView("card")}
              >
                <i className="fa-solid fa-grid-2"></i> Card
              </button>
              <button 
                className={`view-toggle-btn ${view === "table" ? "active" : ""}`}
                onClick={() => setView("table")}
              >
                <i className="fa-solid fa-table"></i> Table
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : view === "table" ? (
            <div className="table-view">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Diagnosis</th>
                    <th>Ward</th>
                    <th>Event Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((patient) => (
                    <tr key={patient.id || patient._id}>
                      <td><strong>{patient.fullName || "Unknown"}</strong></td>
                      <td>{patient.diagnosis || "N/A"}</td>
                      <td>{patient.ward || "N/A"}</td>
                      <td>{getHistoryEventDate(patient) ? new Date(getHistoryEventDate(patient)).toLocaleDateString() : "N/A"}</td>
                      <td>
                        <div className="actions-cell">
                          {(role === "admin" || role === "doctor") && (
                            <button className="action-btn" title="View Details">
                              <i className="fa-solid fa-eye"></i> View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card-grid">
              {filtered.map((patient) => (
                <div key={patient.id || patient._id} className={`patient-card history-card ${starredPatients.includes(patient.id || patient._id) ? 'starred' : ''}`}>
                  <div className="patient-avatar">
                    {patient.profilePicture ? (
                      <img 
                        src={patient.profilePicture} 
                        alt={patient.fullName || 'Patient'}
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <span>{getInitials(patient.fullName)}</span>
                    )}
                  </div>

                  <div className="card-content">
                    <h4>{patient.fullName || "Unknown"}</h4>
                    <p><strong>Diagnosis:</strong> {patient.diagnosis || "N/A"}</p>
                    <p><strong>Ward:</strong> {patient.ward || "N/A"}</p>
                    <p><strong>Status:</strong> {getHistoryStatus(patient)}</p>
                    <p><strong>Event Date:</strong> {getHistoryEventDate(patient) ? new Date(getHistoryEventDate(patient)).toLocaleDateString() : "N/A"}</p>
                    {(role === "admin" || role === "doctor") && (
                      <button className="view-details-btn">
                        <i className="fa-solid fa-file-medical"></i> View Details
                      </button>
                    )}
                  </div>

                  <div
                    className="card-menu"
                    onClick={() =>
                      setShowMenu(showMenu === (patient.id || patient._id) ? null : patient.id || patient._id)
                    }
                  >
                    ⋮
                  </div>

                  {showMenu === (patient.id || patient._id) && (
                    <div className="dropdown-menu">
                      <div onClick={() => handleStarPatient(patient.id || patient._id)}>
                        <i className="fa-solid fa-star"></i> {starredPatients.includes(patient.id || patient._id) ? "Unstar Patient" : "Star Patient"}
                      </div>
                      
                      {(role === "admin" || role === "doctor") && (
                        <div onClick={() => handleViewDetails(patient)}>
                          <i className="fa-solid fa-file-medical"></i> View Details
                        </div>
                      )}

                      {canRemovePatient && (
                        <div className="danger" onClick={() => handleRemovePatient(patient.id || patient._id)}>
                          <i className="fa-solid fa-trash"></i> Remove Record
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="empty-state">
              <i className="fa-solid fa-folder-open"></i>
              <p>No patient history records found</p>
            </div>
          )}
        </div>
      </div>

      {/* View Patient Details Modal */}
      {showDetailsModal && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Patient History Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="patient-details">
              <div className="detail-row">
                <strong>Patient Name:</strong>
                <span>{selectedPatient.fullName || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Diagnosis:</strong>
                <span>{selectedPatient.diagnosis || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Ward:</strong>
                <span>{selectedPatient.ward || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Event Date:</strong>
                <span>{getHistoryEventDate(selectedPatient) ? new Date(getHistoryEventDate(selectedPatient)).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientHistory;

