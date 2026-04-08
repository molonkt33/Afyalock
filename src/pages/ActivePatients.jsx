
import React, { useState, useEffect } from "react";
import { getInitials } from "../utils/getInitials";
import { useNavigate } from "react-router-dom";
import "../styles/ActivePatients.css";

function ActivePatients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("card");
  const [showMenu, setShowMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [starredPatients, setStarredPatients] = useState([]);
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    diagnosis: "",
    ward: "",
  });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  // Role-based access for Active Patients:
  // - Admin, Doctor: Full access (view, add, edit, remove)
  // - Nurse: Register patients, update vitals (view, add, edit)
  // - Reception: View and add patients
  // - Lab, Radiology, Emergency: View only
  const canViewPatients = ["admin", "doctor", "nurse", "reception", "lab", "radiology", "emergency"].includes(role);
  const canAddPatient = ["admin", "doctor", "nurse", "reception"].includes(role);
  const canEditPatient = ["admin", "doctor", "nurse"].includes(role);
  const canRemovePatient = ["admin", "doctor"].includes(role);

  // Handle add new patient
  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!newPatient.firstName || !newPatient.lastName || !newPatient.dateOfBirth || !newPatient.gender || !newPatient.phone) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const { default: api } = await import("../services/api");
      const { data } = await api.post("/patients", newPatient);
      
      // Add new patient to state
      setPatients([data.data || data, ...patients]);
      setShowAddModal(false);
      setNewPatient({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        phone: "",
        diagnosis: "",
        ward: "",
      });
    } catch (err) {
      console.error("Error adding patient:", err);
      alert(err.response?.data?.message || "Failed to add patient");
    } finally {
      setSaving(false);
    }
  };

  // Handle star/favorite patient
  const handleStarPatient = (patientId) => {
    const patientKey = patientId;
    if (starredPatients.includes(patientKey)) {
      setStarredPatients(starredPatients.filter(id => id !== patientKey));
    } else {
      setStarredPatients([...starredPatients, patientKey]);
    }
    setShowMenu(null);
  };

  // Handle view patient details
  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
    setShowMenu(null);
  };

  // Handle remove patient
  const handleRemovePatient = async (patientId) => {
    if (!window.confirm("Are you sure you want to remove this patient?")) {
      setShowMenu(null);
      return;
    }

    try {
      const { default: api } = await import("../services/api");
      await api.delete(`/patients/${patientId}`);
      setPatients(patients.filter(p => (p.id || p._id) !== patientId));
      alert("Patient removed successfully");
    } catch (err) {
      console.error("Error removing patient:", err);
      alert(err.response?.data?.message || "Failed to remove patient");
    } finally {
      setShowMenu(null);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    import("../services/api").then(({ default: api }) => {
      api
        .get("/patients/active")
        .then(({ data }) => {
          if (Array.isArray(data)) {
            setPatients(data);
          } else if (data.data && Array.isArray(data.data)) {
            setPatients(data.data);
          } else {
            console.warn("API response is not an array:", data);
            setPatients([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching patients:", err);
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("user");
            navigate("/login");
          }
          setPatients([]);
        })
        .finally(() => setLoading(false));
    });
  }, [token, navigate]);

  // Access denied check
  if (!canViewPatients) {
    return (
      <div className="d-flex">
        <div className="flex-grow-1 p-5">
          <div className="dashboard-card">
            <div className="access-denied">
              <i className="fa-solid fa-lock"></i>
              <h3>Access Denied</h3>
              <p>You don't have permission to view active patients.</p>
              <p className="role-info">Contact your administrator for access.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filtered = patients.filter((p) =>
    p.fullName?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const aStarred = starredPatients.includes(a.id || a._id);
    const bStarred = starredPatients.includes(b.id || b._id);
    if (aStarred && !bStarred) return -1;
    if (!aStarred && bStarred) return 1;
    return 0;
  });

  return (
    <div className="d-flex">
      <div className="flex-grow-1 p-5">
        {/* TIMETABLE SECTION */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Patients Timetable</h2>
            {canAddPatient ? (
              <button className="primary-btn" onClick={() => setShowAddModal(true)}>
                <i className="fa-solid fa-plus"></i> Add Patient
              </button>
            ) : (
              <button className="primary-btn" disabled title="Insufficient permissions">
                <i className="fa-solid fa-plus"></i> Add Patient
              </button>
            )}
          </div>
          <p>No upcoming appointments</p>
        </div>

        {/* PATIENT OVERVIEW */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Patients Overview</h2>

            <div className="controls">
              <input
                className="search-bar"
                placeholder="Search patients..."
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
                    <th>Admission Date</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((patient) => (
                    <tr key={patient.id || patient._id}>
                      <td><strong>{patient.fullName || "Unknown"}</strong></td>
                      <td>{patient.diagnosis || "N/A"}</td>
                      <td>{patient.ward || "N/A"}</td>
                      <td>{patient.admissionDate || "N/A"}</td>
                      <td>{patient.phone || "N/A"}</td>
                      <td>
                        <div className="actions-cell">
                          {(role === "admin" || role === "doctor") && (
                            <button className="action-btn" title="View Details">
                              <i className="fa-solid fa-eye"></i>
                            </button>
                          )}
                          {canRemovePatient && (
                            <button className="action-btn danger" title="Remove">
                              <i className="fa-solid fa-trash"></i>
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
                <div key={patient.id || patient._id} className={`patient-card ${starredPatients.includes(patient.id || patient._id) ? 'starred' : ''}`}>
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
                    <p>{patient.diagnosis || "No diagnosis"}</p>
                    <p>{patient.ward || "No ward assigned"}</p>
                    <p>Admission: {patient.admissionDate || "N/A"}</p>
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
                          <i className="fa-solid fa-user-minus"></i> Remove Patient
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
              <i className="fa-solid fa-users"></i>
              <p>No active patients found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Patient</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddPatient}>
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="firstName"
                  value={newPatient.firstName}
                  onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="lastName"
                  value={newPatient.lastName}
                  onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  className="form-control"
                  name="dateOfBirth"
                  value={newPatient.dateOfBirth}
                  onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <select
                  className="form-control"
                  name="gender"
                  value={newPatient.gender}
                  onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  className="form-control"
                  name="phone"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Diagnosis</label>
                <input
                  type="text"
                  className="form-control"
                  name="diagnosis"
                  value={newPatient.diagnosis}
                  onChange={(e) => setNewPatient({ ...newPatient, diagnosis: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Ward</label>
                <input
                  type="text"
                  className="form-control"
                  name="ward"
                  value={newPatient.ward}
                  onChange={(e) => setNewPatient({ ...newPatient, ward: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Adding..." : "Add Patient"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Patient Details Modal */}
      {showDetailsModal && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Patient Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="patient-details">
              <div className="detail-row">
                <strong>Name:</strong>
                <span>{selectedPatient.fullName || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Date of Birth:</strong>
                <span>{selectedPatient.dateOfBirth || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Gender:</strong>
                <span>{selectedPatient.gender || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Phone:</strong>
                <span>{selectedPatient.phone || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Email:</strong>
                <span>{selectedPatient.email || "N/A"}</span>
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
                <strong>Admission Date:</strong>
                <span>{selectedPatient.admissionDate || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Notes:</strong>
                <span>{selectedPatient.notes || "N/A"}</span>
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

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .modal-header h3 {
          margin: 0;
          color: #05254d;
          font-family: "Poppins", sans-serif;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #64748b;
          line-height: 1;
        }
        .modal-close:hover {
          color: #05254d;
        }
        .form-group {
          margin-bottom: 15px;
        }
.form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 700;
          color: #111111;
          font-size: 15px;
          text-shadow: 0 1px 1px rgba(0,0,0,0.3);
        }
        .form-control {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: 0.2s ease;
        }
        .form-control:focus {
          outline: none;
          border-color: #05254d;
          box-shadow: 0 0 0 3px rgba(5, 37, 77, 0.1);
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .modal-actions .btn {
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          border: none;
        }
        .btn-secondary {
          background: #e2e8f0;
          color: #475569;
        }
        .btn-secondary:hover {
          background: #cbd5e1;
        }
        .primary-btn {
          background: #05254d;
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .primary-btn:hover:not(:disabled) {
          background: #0a3d6e;
        }
        .primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .patient-details {
          margin-bottom: 20px;
        }
        .detail-row {
          display: flex;
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-row strong {
          min-width: 140px;
          color: #05254d;
          font-weight: 600;
        }
        .detail-row span {
          color: #475569;
          flex: 1;
        }
      `}</style>
    </div>
  );
}

export default ActivePatients;

