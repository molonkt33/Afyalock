
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ActivePatients.css";

function Radiology() {
  const [scans, setScans] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("card");
  const [showMenu, setShowMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedScan, setSelectedScan] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [starredScans, setStarredScans] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newScan, setNewScan] = useState({
    fullName: "",
    scanType: "",
    priority: "Routine",
  });

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  // Role-based access for Radiology:
  // - Admin, Doctor: Full access (view, schedule, upload, remove)
  // - Radiology Staff: Upload imaging reports (view, schedule, upload)
  // - Nurse, Reception, Lab, Emergency: View only
  const canViewScans = ["admin", "doctor", "nurse", "radiology", "reception", "lab", "emergency"].includes(role);
  const canScheduleScan = ["admin", "doctor", "radiology"].includes(role);
  const canUploadScan = ["admin", "doctor", "radiology"].includes(role);
  const canRemoveScan = ["admin", "doctor"].includes(role);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    import("../services/api").then(({ default: api }) => {
      api
        .get("/radiology")
        .then(({ data }) => {
          if (Array.isArray(data)) {
            setScans(data);
          } else if (data.data && Array.isArray(data.data)) {
            setScans(data.data);
          } else {
            setScans([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching radiology reports:", err);
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("user");
            navigate("/login");
          }
          setScans([]);
        })
        .finally(() => setLoading(false));
    });
  }, [token, navigate]);

  // Access denied check
  if (!canViewScans) {
    return (
      <div className="d-flex">
        <div className="flex-grow-1 p-5">
          <div className="dashboard-card">
            <div className="access-denied">
              <i className="fa-solid fa-lock"></i>
              <h3>Access Denied</h3>
              <p>You don't have permission to view radiology records.</p>
              <p className="role-info">Contact your administrator for access.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filtered = scans.filter((scan) =>
    scan.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    scan.scanType?.toLowerCase().includes(search.toLowerCase())
  );

  const getPriorityClass = (priority) => {
    if (priority === "Urgent") return "scan-urgent";
    return "scan-routine";
  };

  const getStatusClass = (status) => {
    if (status === "Completed") return "scan-completed";
    if (status === "In Review") return "scan-review";
    return "scan-pending";
  };

  // Handle star/favorite scan
  const handleStarScan = (scanId) => {
    const scanKey = scanId;
    if (starredScans.includes(scanKey)) {
      setStarredScans(starredScans.filter(id => id !== scanKey));
    } else {
      setStarredScans([...starredScans, scanKey]);
    }
    setShowMenu(null);
  };

  // Handle view scan details
  const handleViewDetails = (scan) => {
    setSelectedScan(scan);
    setShowDetailsModal(true);
    setShowMenu(null);
  };

  // Handle update status
  const handleUpdateStatus = (scan) => {
    setSelectedScan(scan);
    setNewStatus(scan.status || "");
    setShowStatusModal(true);
    setShowMenu(null);
  };

  // Handle save status update
  const handleSaveStatus = async () => {
    if (!selectedScan || !newStatus) return;

    try {
      const { default: api } = await import("../services/api");
      await api.put(`/radiology/${selectedScan.id || selectedScan._id}`, { status: newStatus });
      setScans(scans.map(s => 
        (s.id || s._id) === (selectedScan.id || selectedScan._id) 
          ? { ...s, status: newStatus } 
          : s
      ));
      setShowStatusModal(false);
      alert("Status updated successfully");
    } catch (err) {
      console.error("Error updating status:", err);
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  // Handle remove scan
  const handleRemoveScan = async (scanId) => {
    if (!window.confirm("Are you sure you want to remove this record?")) {
      setShowMenu(null);
      return;
    }

    try {
      const { default: api } = await import("../services/api");
      await api.delete(`/radiology/${scanId}`);
      setScans(scans.filter(s => (s.id || s._id) !== scanId));
      alert("Record removed successfully");
    } catch (err) {
      console.error("Error removing record:", err);
      alert(err.response?.data?.message || "Failed to remove record");
    } finally {
      setShowMenu(null);
    }
  };

  // Handle add new scan (schedule scan)
  const handleAddScan = async (e) => {
    e.preventDefault();
    if (!newScan.fullName || !newScan.scanType) {
      alert("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      const { default: api } = await import("../services/api");
      const { data } = await api.post("/radiology", newScan);
      
      // Add new scan to state
      setScans([data.data || data, ...scans]);
      setShowAddModal(false);
      setNewScan({
        fullName: "",
        scanType: "",
        priority: "Routine",
      });
      alert("Scan scheduled successfully!");
    } catch (err) {
      console.error("Error scheduling scan:", err);
      alert(err.response?.data?.message || "Failed to schedule scan");
    } finally {
      setSaving(false);
    }
  };

  // Handle upload file for existing scan
  const handleUploadFile = async (scanId) => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("fullName", scans.find((s) => s._id === scanId)?.fullName || "");
    formData.append("scanType", scans.find((s) => s._id === scanId)?.scanType || "");

    setUploading(true);
    try {
      const { default: api } = await import("../services/api");
      const { data } = await api.post("/radiology", formData);
      
      if (data.success || data.data) {
        alert("Scan uploaded successfully");
        setShowUploadModal(false);
        setSelectedFile(null);
        // Update the scan in the list
        const updatedScans = scans.map(s => 
          s._id === scanId ? { ...s, fileUrl: data.data?.fileUrl, status: "Completed" } : s
        );
        setScans(updatedScans);
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      alert(err.response?.data?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  // Open upload modal for a specific scan
  const openUploadModal = (scan) => {
    setSelectedScan(scan);
    setShowUploadModal(true);
    setShowMenu(null);
  };

  return (
    <div className="d-flex">
      <div className="flex-grow-1 p-5">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Radiology & Imaging</h2>
            {canScheduleScan ? (
              <button className="primary-btn radiology-btn" onClick={() => setShowAddModal(true)}>
                <i className="fa-solid fa-x-ray"></i> Schedule Scan
              </button>
            ) : (
              <button className="primary-btn" disabled title="Insufficient permissions">
                <i className="fa-solid fa-x-ray"></i> Schedule Scan
              </button>
            )}
          </div>

          <div className="controls">
            <input
              className="search-bar"
              placeholder="Search scan record..."
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
                    <th>Scan Type</th>
                    <th>Radiologist</th>
                    <th>Scan Date</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((scan) => (
                    <tr key={scan.id || scan._id}>
                      <td><strong>{scan.fullName || "Unknown Patient"}</strong></td>
                      <td>{scan.scanType || "N/A"}</td>
                      <td>{scan.radiologist || "N/A"}</td>
                      <td>{scan.scanDate || "N/A"}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(scan.status)}`}>
                          {scan.status || "Pending"}
                        </span>
                      </td>
                      <td>
                        <span className={`priority-indicator ${getPriorityClass(scan.priority)}`}>
                          {scan.priority || "Routine"}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button className="action-btn" title="View Details">
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          {canRemoveScan && (
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
              {filtered.map((scan) => (
                <div
                  key={scan.id || scan._id}
                  className={`patient-card ${getPriorityClass(scan.priority)} ${getStatusClass(scan.status)}`}
                >
                  <div className="card-icon radiology-icon"></div>

                  <div className="card-content">
                    <h4>{scan.fullName || "Unknown Patient"}</h4>
                    <p><strong>Scan Type:</strong> {scan.scanType || "N/A"}</p>
                    <p><strong>Radiologist:</strong> {scan.radiologist || "N/A"}</p>
                    <p><strong>Date:</strong> {scan.scanDate || "N/A"}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status-badge ${getStatusClass(scan.status)}`}>
                        {scan.status || "Pending"}
                      </span>
                    </p>
                    <p><strong>Priority:</strong> 
                      <span className={`priority-indicator ${getPriorityClass(scan.priority)}`}>
                        {scan.priority || "Routine"}
                      </span>
                    </p>

                    {(scan.fileUrl || scan.status === "Completed") && (
                      <div className="scan-actions">
                        {scan.fileUrl && (
                          <a
                            href={`/api${scan.fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="report-link"
                          >
                            <i className="fa-solid fa-file-medical-alt"></i> View Report
                          </a>
                        )}
                        {scan.fileUrl && scan.fileUrl.match(/\.(jpg|jpeg|png)$/i) && (
                          <a
                            href={`/api${scan.fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="report-link"
                          >
                            <i className="fa-solid fa-images"></i> View Image
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className="card-menu"
                    onClick={() =>
                      setShowMenu(showMenu === (scan.id || scan._id) ? null : scan.id || scan._id)
                    }
                  >
                    ⋮
                  </div>

                  {showMenu === (scan.id || scan._id) && (
                    <div className="dropdown-menu">
                      <div onClick={() => handleStarScan(scan.id || scan._id)}>
                        <i className="fa-solid fa-star"></i> {starredScans.includes(scan.id || scan._id) ? "Unstar Scan" : "Star Scan"}
                      </div>

                      <div onClick={() => handleViewDetails(scan)}>
                        <i className="fa-solid fa-eye"></i> View Details
                      </div>
                      
                      {canUploadScan && (
                        <div onClick={() => openUploadModal(scan)}>
                          <i className="fa-solid fa-upload"></i> Upload Scan
                        </div>
                      )}

                      <div onClick={() => handleUpdateStatus(scan)}>
                        <i className="fa-solid fa-pen"></i> Update Status
                      </div>

                      {canRemoveScan && (
                        <div className="danger" onClick={() => handleRemoveScan(scan.id || scan._id)}>
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
              <i className="fa-solid fa-x-ray"></i>
              <p>No scan records found</p>
            </div>
          )}
        </div>
      </div>

      {/* View Scan Details Modal */}
      {showDetailsModal && selectedScan && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Scan Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="patient-details">
              <div className="detail-row">
                <strong>Patient Name:</strong>
                <span>{selectedScan.fullName || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Scan Type:</strong>
                <span>{selectedScan.scanType || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Radiologist:</strong>
                <span>{selectedScan.radiologist || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Scan Date:</strong>
                <span>{selectedScan.scanDate || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span>{selectedScan.status || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Priority:</strong>
                <span>{selectedScan.priority || "N/A"}</span>
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
      {showStatusModal && selectedScan && (
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
                <option value="Completed">Completed</option>
                <option value="In Review">In Review</option>
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

      {/* Add Scan Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule Radiology Scan</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddScan}>
              <div className="form-group">
                <label>Patient Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="fullName"
                  value={newScan.fullName}
                  onChange={(e) => setNewScan({ ...newScan, fullName: e.target.value })}
                  placeholder="Enter patient name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Scan Type *</label>
                <input
                  type="text"
                  className="form-control"
                  name="scanType"
                  value={newScan.scanType}
                  onChange={(e) => setNewScan({ ...newScan, scanType: e.target.value })}
                  placeholder="e.g., X-Ray, MRI, CT Scan, Ultrasound"
                  required
                />

              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                <select
                  className="form-control"
                  name="priority"
                  value={newScan.priority}
                  onChange={(e) => setNewScan({ ...newScan, priority: e.target.value })}
                >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Scheduled Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newScan.scheduledDate}
                    onChange={(e) => setNewScan({ ...newScan, scheduledDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="primary-btn radiology-btn" disabled={saving}>
                  {saving ? "Scheduling..." : "Schedule Scan"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Scan Modal */}
      {showUploadModal && selectedScan && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Scan Report</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            <div className="patient-details">
              <div className="detail-row">
                <strong>Patient:</strong>
                <span>{selectedScan.fullName || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Scan Type:</strong>
                <span>{selectedScan.scanType || "N/A"}</span>
              </div>
            </div>
            <div className="form-group">
              <label>Select Report File (PDF or Image)</label>
              <input
                type="file"
                className="form-control"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="primary-btn radiology-btn" 
                onClick={() => handleUploadFile(selectedScan._id)}
                disabled={uploading || !selectedFile}
              >
                {uploading ? "Uploading..." : "Upload Scan"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                Cancel
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
          color: #000000;
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
          color: #000000;
        }
        .form-group {
          margin-bottom: 15px;
        }
.form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #000000;
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
          border-color: #000000;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
        }
        .form-row {
          display: flex;
          gap: 15px;
        }
        .form-row .form-group {
          flex: 1;
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
        .radiology-btn {
          background: #0891b2;
        }
        .radiology-btn:hover:not(:disabled) {
          background: #0e7490;
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
          min-width: 100px;
          color: #000000;
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

export default Radiology;

