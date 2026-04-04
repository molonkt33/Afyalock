
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/ActivePatients.css";

function Emergency() {
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("card");
  const [showMenu, setShowMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [starredCases, setStarredCases] = useState([]);
  const [saving, setSaving] = useState(false);
  const [newCase, setNewCase] = useState({
    fullName: "",
    age: "",
    gender: "",
    condition: "",
    priority: "Medium",
    phone: "",
  });

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Role-based access for Emergency:
  // - Admin, Emergency Staff: Full access (view, admit emergency patients)
  // - Doctor: View and manage emergency cases
  // - Nurse: View and assist with emergency cases
  // - Reception, Lab, Radiology: View only
  const canViewEmergency = ["admin", "doctor", "nurse", "emergency", "reception", "lab", "radiology"].includes(role);
  const canAdmitPatient = ["admin", "doctor", "emergency"].includes(role);
  const canRemovePatient = ["admin", "doctor", "emergency"].includes(role);
  const canRegisterEmergency = ["admin", "doctor", "nurse", "emergency"].includes(role);
  const canEditCase = ["admin", "doctor", "emergency"].includes(role);
  const canRemoveCase = ["admin", "doctor"].includes(role);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    import("../services/api").then(({ default: api }) => {
      api
        .get("/emergency")
        .then(({ data }) => {
          if (Array.isArray(data)) {
            setCases(data);
          } else if (data.data && Array.isArray(data.data)) {
            setCases(data.data);
          } else {
            setCases([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching emergency cases:", err);
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("user");
            navigate("/login");
          }
          setCases([]);
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
    
    if (detailsId && cases.length > 0) {
      const emergencyCase = cases.find(c => (c.id || c._id) === detailsId);
      if (emergencyCase) {
        setSelectedCase(emergencyCase);
        setShowDetailsModal(true);
      }
    }
  }, [searchParams, cases]);

  // Access denied check
  if (!canViewEmergency) {
    return (
      <div className="d-flex">
        <div className="flex-grow-1 p-5">
          <div className="dashboard-card">
            <div className="access-denied">
              <i className="fa-solid fa-lock"></i>
              <h3>Access Denied</h3>
              <p>You don't have permission to view emergency cases.</p>
              <p className="role-info">Contact your administrator for access.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filtered = cases.filter((c) =>
    c.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const getPriorityClass = (priority) => {
    if (priority === "Critical") return "priority-critical";
    if (priority === "High") return "priority-high";
    return "priority-medium";
  };

  // Handle star/favorite case
  const handleStarCase = (caseId) => {
    const caseKey = caseId;
    if (starredCases.includes(caseKey)) {
      setStarredCases(starredCases.filter(id => id !== caseKey));
    } else {
      setStarredCases([...starredCases, caseKey]);
    }
    setShowMenu(null);
  };

  // Handle view case details
  const handleViewDetails = (caseItem) => {
    setSelectedCase(caseItem);
    setShowDetailsModal(true);
    setShowMenu(null);
  };

  // Handle update status
  const handleUpdateStatus = (caseItem) => {
    setSelectedCase(caseItem);
    setNewStatus(caseItem.status || "");
    setShowStatusModal(true);
    setShowMenu(null);
  };

  // Handle save status update
  const handleSaveStatus = async () => {
    if (!selectedCase || !newStatus) return;

    try {
      const { default: api } = await import("../services/api");
      await api.put(`/emergency/${selectedCase.id || selectedCase._id}`, { status: newStatus });
      setCases(cases.map(c => 
        (c.id || c._id) === (selectedCase.id || selectedCase._id) 
          ? { ...c, status: newStatus } 
          : c
      ));
      setShowStatusModal(false);
      alert("Status updated successfully");
    } catch (err) {
      console.error("Error updating status:", err);
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  // Handle remove case
  const handleRemoveCase = async (caseId) => {
    if (!window.confirm("Are you sure you want to remove this case?")) {
      setShowMenu(null);
      return;
    }

    try {
      const { default: api } = await import("../services/api");
      await api.delete(`/emergency/${caseId}`);
      setCases(cases.filter(c => (c.id || c._id) !== caseId));
      alert("Case removed successfully");
    } catch (err) {
      console.error("Error removing case:", err);
      alert(err.response?.data?.message || "Failed to remove case");
    } finally {
      setShowMenu(null);
    }
  };

  // Handle add new emergency case
  const handleAddCase = async (e) => {
    e.preventDefault();
    if (!newCase.fullName || !newCase.condition) {
      alert("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      const { default: api } = await import("../services/api");
      const { data } = await api.post("/emergency", newCase);
      
      // Add new case to state
      setCases([data.data || data, ...cases]);
      setShowAddModal(false);
      setNewCase({
        fullName: "",
        age: "",
        gender: "",
        condition: "",
        priority: "Medium",
        phone: "",
      });
      alert("Emergency case registered successfully!");
    } catch (err) {
      console.error("Error adding emergency case:", err);
      alert(err.response?.data?.message || "Failed to register emergency case");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="d-flex">
      <div className="flex-grow-1 p-5">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Emergency Cases</h2>
            {canRegisterEmergency ? (
              <button className="primary-btn emergency-btn" onClick={() => setShowAddModal(true)}>
                <i className="fa-solid fa-ambulance"></i> Register Emergency
              </button>
            ) : (
              <button className="primary-btn" disabled title="Insufficient permissions">
                <i className="fa-solid fa-ambulance"></i> Register Emergency
              </button>
            )}
          </div>

          <div className="controls">
            <input
              className="search-bar"
              placeholder="Search emergency case..."
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
                    <th>Condition</th>
                    <th>Triage Nurse</th>
                    <th>Arrival Time</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id || c._id} className={getPriorityClass(c.priority)}>
                      <td><strong>{c.fullName || "Unknown"}</strong></td>
                      <td>{c.condition || "N/A"}</td>
                      <td>{c.triageNurse || "N/A"}</td>
                      <td>{c.arrivalTime || "N/A"}</td>
                      <td>
                        <span className={`status-badge ${c.status?.toLowerCase() || "pending"}`}>
                          {c.status || "Pending"}
                        </span>
                      </td>
                      <td>
                        <span className={`priority-indicator ${getPriorityClass(c.priority)}`}>
                          {c.priority || "Medium"}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          {(role === "admin" || role === "doctor") && (
                            <button className="action-btn" title="View Details">
                              <i className="fa-solid fa-eye"></i>
                            </button>
                          )}
                          {canRemoveCase && (
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
              {filtered.map((c) => (
                <div
                  key={c.id || c._id}
                  className={`patient-card emergency-card ${getPriorityClass(c.priority)}`}
                >
                  <div className="card-icon emergency-icon"></div>

                  <div className="card-content">
                    <h4>{c.fullName || "Unknown"}</h4>
                    <p><strong>Condition:</strong> {c.condition || "N/A"}</p>
                    <p><strong>Triage Nurse:</strong> {c.triageNurse || "N/A"}</p>
                    <p><strong>Arrival:</strong> {c.arrivalTime || "N/A"}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status-badge ${c.status?.toLowerCase() || "pending"}`}>
                        {c.status || "Pending"}
                      </span>
                    </p>
                    <p><strong>Priority:</strong> 
                      <span className={`priority-indicator ${getPriorityClass(c.priority)}`}>
                        {c.priority || "Medium"}
                      </span>
                    </p>
                  </div>

                  <div
                    className="card-menu"
                    onClick={() =>
                      setShowMenu(showMenu === (c.id || c._id) ? null : c.id || c._id)
                    }
                  >
                    ⋮
                  </div>

                  {showMenu === (c.id || c._id) && (
                    <div className="dropdown-menu">
                      <div onClick={() => handleStarCase(c.id || c._id)}>
                        <i className="fa-solid fa-star"></i> {starredCases.includes(c.id || c._id) ? "Unstar Case" : "Star Case"}
                      </div>

                      <div onClick={() => handleUpdateStatus(c)}>
                        <i className="fa-solid fa-pen"></i> Update Status
                      </div>

                      {(role === "admin" || role === "doctor") && (
                        <div onClick={() => handleViewDetails(c)}>
                          <i className="fa-solid fa-file-medical"></i> View Details
                        </div>
                      )}

                      {canRemoveCase && (
                        <div className="danger" onClick={() => handleRemoveCase(c.id || c._id)}>
                          <i className="fa-solid fa-trash"></i> Remove Case
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
              <i className="fa-solid fa-kit-medical"></i>
              <p>No emergency cases found</p>
            </div>
          )}
        </div>
      </div>

      {/* View Case Details Modal */}
      {showDetailsModal && selectedCase && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Emergency Case Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="patient-details">
              <div className="detail-row">
                <strong>Patient Name:</strong>
                <span>{selectedCase.fullName || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Condition:</strong>
                <span>{selectedCase.condition || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Triage Nurse:</strong>
                <span>{selectedCase.triageNurse || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Arrival Time:</strong>
                <span>{selectedCase.arrivalTime || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span>{selectedCase.status || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Priority:</strong>
                <span>{selectedCase.priority || "N/A"}</span>
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

      {/* Update Status Modal */}
      {showStatusModal && selectedCase && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Status</h3>
              <button className="modal-close" onClick={() => setShowStatusModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>New Status</label>
              <select
                className="form-control"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Select Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Stable">Stable</option>
                <option value="Discharged">Discharged</option>
                <option value="Transferred">Transferred</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="primary-btn" onClick={handleSaveStatus}>
                Save
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Emergency Case Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register Emergency Case</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddCase}>
              <div className="form-group">
                <label>Patient Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="fullName"
                  value={newCase.fullName}
                  onChange={(e) => setNewCase({ ...newCase, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newCase.age}
                    onChange={(e) => setNewCase({ ...newCase, age: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    className="form-control"
                    value={newCase.gender}
                    onChange={(e) => setNewCase({ ...newCase, gender: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Condition *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newCase.condition}
                  onChange={(e) => setNewCase({ ...newCase, condition: e.target.value })}
                  placeholder="e.g., Chest pain, Trauma, Difficulty breathing"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    className="form-control"
                    value={newCase.priority}
                    onChange={(e) => setNewCase({ ...newCase, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={newCase.phone}
                    onChange={(e) => setNewCase({ ...newCase, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Triage Nurse</label>
                <input
                  type="text"
                  className="form-control"
                  value={newCase.triageNurse}
                  onChange={(e) => setNewCase({ ...newCase, triageNurse: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  className="form-control"
                  value={newCase.notes}
                  onChange={(e) => setNewCase({ ...newCase, notes: e.target.value })}
                  rows="3"
                  placeholder="Additional notes about the emergency case..."
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="primary-btn emergency-btn" disabled={saving}>
                  {saving ? "Registering..." : "Register Case"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .emergency-modal .modal-overlay {
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
        .emergency-modal .modal-content {
          background: white;
          padding: 30px;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          max-height: 90vh;
          overflow-y: auto;
        }
        .emergency-modal .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .emergency-modal .modal-header h3 {
          margin: 0;
          color: #05254d;
          font-family: var(--base-font-family-default-latin);
        }
        .emergency-modal .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #64748b;
          line-height: 1;
        }
        .emergency-modal .modal-close:hover {
          color: #05254d;
        }
        .emergency-modal .form-group {
          margin-bottom: 15px;
        }
        .emergency-modal .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #05254d;
        }
        .emergency-modal .form-control {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: 0.2s ease;
        }
        .emergency-modal .form-control:focus {
          outline: none;
          border-color: #05254d;
          box-shadow: 0 0 0 3px rgba(5, 37, 77, 0.1);
        }
        .emergency-modal .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .emergency-modal .modal-actions .btn {
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          border: none;
        }
        .emergency-modal .btn-secondary {
          background: #e2e8f0;
          color: #475569;
        }
        .emergency-modal .btn-secondary:hover {
          background: #cbd5e1;
        }
        .emergency-modal .primary-btn {
          background: #05254d;
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        .emergency-modal .primary-btn:hover:not(:disabled) {
          background: #0a3d6e;
        }
        .emergency-modal .patient-details {
          margin-bottom: 20px;
        }
        .emergency-modal .detail-row {
          display: flex;
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .emergency-modal .detail-row:last-child {
          border-bottom: none;
        }
        .emergency-modal .detail-row strong {
          min-width: 140px;
          color: #05254d;
          font-weight: 600;
        }
        .emergency-modal .detail-row span {
          color: #475569;
          flex: 1;
        }
      `}</style>
    </div>
  );
}

export default Emergency;

