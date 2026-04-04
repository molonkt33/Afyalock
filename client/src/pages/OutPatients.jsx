
import React, { useState, useEffect } from "react";
import { getInitials } from "../utils/getInitials";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/ActivePatients.css";

function OutPatients() {
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
    fullName: "",
    reason: "",
    assignedDoctor: "",
    visitDate: "",
    status: "Pending",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Role-based access for OutPatients:
  // - Admin, Doctor: Full access (view, add, edit, remove)
  // - Nurse: View and add
  // - Receptionist: Manage appointments & outpatient records (view, add, edit)
  // - Lab, Radiology, Emergency: View only
  const canViewPatients = ["admin", "doctor", "nurse", "reception", "lab", "radiology", "emergency"].includes(role);
  const canAddPatient = ["admin", "doctor", "nurse", "reception"].includes(role);
  const canEditPatient = ["admin", "doctor", "reception"].includes(role);
  const canRemovePatient = ["admin", "doctor"].includes(role);

  // Handle add new patient
  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!newPatient.fullName || !newPatient.reason) {
      alert("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      const { default: api } = await import("../services/api");
      const { data } = await api.post("/outpatients", newPatient);
      
      // Add new patient to state
      setPatients([data.data || data, ...patients]);
      setShowAddModal(false);
      setNewPatient({
        fullName: "",
        reason: "",
        assignedDoctor: "",
        visitDate: "",
        status: "Pending",
        phone: "",
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
    if (!window.confirm("Are you sure you want to remove this record?")) {
      setShowMenu(null);
      return;
    }

    try {
      const { default: api } = await import("../services/api");
      await api.delete(`/outpatients/${patientId}`);
      setPatients(patients.filter(p => (p.id || p._id) !== patientId));
      alert("Record removed successfully");
    } catch (err) {
      console.error("Error removing record:", err);
      alert(err.response?.data?.message || "Failed to remove record");
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
        .get("/outpatients")
        .then(({ data }) => {
          if (Array.isArray(data)) {
            setPatients(data);
          } else if (data.data && Array.isArray(data.data)) {
            setPatients(data.data);
          } else {
            setPatients([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching outpatients:", err);
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

  // Handle URL parameters for direct navigation
  useEffect(() => {
    const detailsId = searchParams.get('details');
    const searchQuery = searchParams.get('search');
    
    if (searchQuery) {
      setSearch(searchQuery);
    }
    
    if (detailsId && patients.length > 0) {
      const patient = patients.find(p => (p.id || p._id) === detailsId);
      if (patient) {
        setSelectedPatient(patient);
        setShowDetailsModal(true);
      }
    }
  }, [searchParams, patients]);

  // Access denied check
  if (!canViewPatients) {
    return (
      <div className="d-flex">
        <div className="flex-grow-1 p-5">
          <div className="dashboard-card">
            <div className="access-denied">
              <i className="fa-solid fa-lock"></i>
              <h3>Access Denied</h3>
              <p>You don't have permission to view outpatient records.</p>
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
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>OutPatients Overview</h2>
            {canAddPatient ? (
              <button className="primary-btn" onClick={() => setShowAddModal(true)}>
                <i className="fa-solid fa-plus"></i> Add OutPatient
              </button>
            ) : (
              <button className="primary-btn" disabled title="Insufficient permissions">
                <i className="fa-solid fa-plus"></i> Add OutPatient
              </button>
            )}
          </div>

          <div className="controls">
            <input
              className="search-bar"
              placeholder="Search outpatient..."
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
                    <th>Reason</th>
                    <th>Doctor</th>
                    <th>Visit Date</th>
                    <th>Status</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((patient) => (
                    <tr key={patient.id || patient._id}>
                      <td><strong>{patient.fullName || "Unknown"}</strong></td>
                      <td>{patient.reason || "N/A"}</td>
                      <td>{patient.assignedDoctor || "N/A"}</td>
                      <td>{patient.visitDate || "N/A"}</td>
                      <td>
                        <span className={`status-badge ${patient.status?.toLowerCase()}`}>
                          {patient.status || "Pending"}
                        </span>
                      </td>
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
                <div key={patient.id || patient._id} className={`patient-card outpatient-card ${starredPatients.includes(patient.id || patient._id) ? 'starred' : ''}`}>
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
                    <p><strong>Reason:</strong> {patient.reason || "N/A"}</p>
                    <p><strong>Doctor:</strong> {patient.assignedDoctor || "N/A"}</p>
                    <p><strong>Date:</strong> {patient.visitDate || "N/A"}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status-badge ${patient.status?.toLowerCase()}`}>
                        {patient.status || "Pending"}
                      </span>
                    </p>
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
              <i className="fa-solid fa-user-injured"></i>
              <p>No outpatient records found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New OutPatient</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddPatient}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="fullName"
                  value={newPatient.fullName}
                  onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Reason for Visit *</label>
                <input
                  type="text"
                  className="form-control"
                  name="reason"
                  value={newPatient.reason}
                  onChange={(e) => setNewPatient({ ...newPatient, reason: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Assigned Doctor</label>
                <input
                  type="text"
                  className="form-control"
                  name="assignedDoctor"
                  value={newPatient.assignedDoctor}
                  onChange={(e) => setNewPatient({ ...newPatient, assignedDoctor: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Visit Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="visitDate"
                  value={newPatient.visitDate}
                  onChange={(e) => setNewPatient({ ...newPatient, visitDate: e.target.value })}
                />

              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  name="phone"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
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
              <h3>OutPatient Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="patient-details">
              <div className="detail-row">
                <strong>Name:</strong>
                <span>{selectedPatient.fullName || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Reason:</strong>
                <span>{selectedPatient.reason || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Doctor:</strong>
                <span>{selectedPatient.assignedDoctor || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Visit Date:</strong>
                <span>{selectedPatient.visitDate || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span>{selectedPatient.status || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Phone:</strong>
                <span>{selectedPatient.phone || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Email:</strong>
                <span>{selectedPatient.email || "N/A"}</span>
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
          font-family: var(--base-font-family-default-latin);
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
          font-weight: 600;
          color: #05254d;
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
          min-width: 120px;
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

export default OutPatients;

