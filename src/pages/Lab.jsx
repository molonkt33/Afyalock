
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ActivePatients.css";

function Lab() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("card");
  const [showMenu, setShowMenu] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [starredReports, setStarredReports] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newReport, setNewReport] = useState({
    patient: "",
    testName: "",
  });

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  // Role-based access for Lab:
  // - Admin, Doctor: Full access (view, order, upload, remove)
  // - Lab Technician: Upload lab results (view, order, upload)
  // - Nurse, Reception, Radiology, Emergency: View only
  const canViewReports = ["admin", "doctor", "nurse", "lab", "reception", "radiology", "emergency"].includes(role);
  const canOrderTest = ["admin", "doctor", "lab"].includes(role);
  const canUploadReport = ["admin", "doctor", "lab"].includes(role);
  const canRemoveReport = ["admin", "doctor"].includes(role);

  // ================= FETCH LAB REPORTS =================
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    import("../services/api").then(({ default: api }) => {
      api
        .get("/labs?page=1&limit=50")
        .then(({ data }) => {
          if (data.success && Array.isArray(data.data)) {
            setReports(data.data);
          } else if (Array.isArray(data)) {
            setReports(data);
          } else if (data.data && Array.isArray(data.data)) {
            setReports(data.data);
          } else {
            console.warn("Unexpected lab data format:", data);
            setReports([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching lab reports:", err);
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("user");
            navigate("/login");
          }
          setReports([]);
        })
        .finally(() => setLoading(false));
    });
  }, [token, navigate]);

  // Access denied check
  if (!canViewReports) {
    return (
      <div className="d-flex">
        <div className="flex-grow-1 p-5">
          <div className="dashboard-card">
            <div className="access-denied">
              <i className="fa-solid fa-lock"></i>
              <h3>Access Denied</h3>
              <p>You don't have permission to view lab reports.</p>
              <p className="role-info">Contact your administrator for access.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= SEARCH FILTER =================
  const filtered = reports.filter((r) =>
    r.testName?.toLowerCase().includes(search.toLowerCase()) ||
    r.patient?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const aStarred = starredReports.includes(a._id);
    const bStarred = starredReports.includes(b._id);
    if (aStarred && !bStarred) return -1;
    if (!aStarred && bStarred) return 1;
    return 0;
  });

  // ================= FILE UPLOAD =================
  const handleUpload = async (reportId) => {
    if (!selectedFile) return alert("Select a file first");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("patient", reports.find((r) => r._id === reportId).patient);
    formData.append("testName", reports.find((r) => r._id === reportId).testName);

    try {
      const { data } = await import("../services/api").then((m) => m.default.post("/labs", formData));
      if (data.success) {
        alert("Report uploaded successfully");
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusClass = (status) => {
    if (status === "Completed") return "lab-completed";
    if (status === "Processing") return "lab-processing";
    return "lab-pending";
  };

  // Handle star/favorite report
  const handleStarReport = (reportId) => {
    if (starredReports.includes(reportId)) {
      setStarredReports(starredReports.filter(id => id !== reportId));
    } else {
      setStarredReports([...starredReports, reportId]);
    }
    setShowMenu(null);
  };

  // Handle view report details
  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
    setShowMenu(null);
  };

  // Handle remove report
  const handleRemoveReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to remove this record?")) {
      setShowMenu(null);
      return;
    }

    try {
      const { default: api } = await import("../services/api");
      await api.delete(`/labs/${reportId}`);
      setReports(reports.filter(r => r._id !== reportId));
      alert("Record removed successfully");
    } catch (err) {
      console.error("Error removing record:", err);
      alert(err.response?.data?.message || "Failed to remove record");
    } finally {
      setShowMenu(null);
    }
  };

  // Handle add new lab report (order test)
  const handleAddReport = async (e) => {
    e.preventDefault();
    if (!newReport.patient || !newReport.testName) {
      alert("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      const { default: api } = await import("../services/api");
      const { data } = await api.post("/labs", newReport);
      
      // Add new report to state
      if (data.success) {
        setReports([data.data, ...reports]);
        setShowAddModal(false);
        setNewReport({
          patient: "",
          testName: "",
        });
        alert("Lab test ordered successfully!");
      }
    } catch (err) {
      console.error("Error ordering test:", err);
      alert(err.response?.data?.message || "Failed to order test");
    } finally {
      setSaving(false);
    }
  };

  // Handle upload file for existing report
  const handleUploadFile = async (reportId) => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("patient", reports.find((r) => r._id === reportId)?.patient || "");
    formData.append("testName", reports.find((r) => r._id === reportId)?.testName || "");

    setUploading(true);
    try {
      const { default: api } = await import("../services/api");
      const { data } = await api.post("/labs", formData);
      
      if (data.success) {
        alert("Report uploaded successfully");
        setShowUploadModal(false);
        setSelectedFile(null);
        // Update the report in the list if needed
        const updatedReports = reports.map(r => 
          r._id === reportId ? { ...r, fileUrl: data.data.fileUrl, status: "Completed" } : r
        );
        setReports(updatedReports);
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      alert(err.response?.data?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  // Open upload modal for a specific report
  const openUploadModal = (report) => {
    setSelectedReport(report);
    setShowUploadModal(true);
    setShowMenu(null);
  };

  return (
    <div className="d-flex">
      <div className="flex-grow-1 p-5">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Lab Reports</h2>
            {canOrderTest ? (
              <button className="primary-btn lab-btn" onClick={() => setShowAddModal(true)}>
                <i className="fa-solid fa-flask"></i> Order Test
              </button>
            ) : (
              <button className="primary-btn" disabled title="Insufficient permissions">
                <i className="fa-solid fa-flask"></i> Order Test
              </button>
            )}
          </div>

          <div className="controls">
            <input
              className="search-bar"
              placeholder="Search by test name or patient..."
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
                    <th>Test Name</th>
                    <th>Patient</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Report</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((report) => (
                    <tr key={report._id}>
                      <td><strong>{report.testName || "Unknown Test"}</strong></td>
                      <td>{report.patient || "N/A"}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(report.status)}`}>
                          {report.status || "Pending"}
                        </span>
                      </td>
                      <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td>
                        {report.fileUrl && (
                          <a
                            href={`/api${report.fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="report-link"
                          >
                            <i className="fa-solid fa-file-pdf"></i> View
                          </a>
                        )}
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button className="action-btn" title="View Details">
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          {canRemoveReport && (
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
              {filtered.map((report) => (
                <div
                  key={report._id}
                  className={`patient-card ${getStatusClass(report.status)} ${starredReports.includes(report._id) ? 'starred' : ''}`}
                >
                  <div className="card-icon lab-icon"></div>

                  <div className="card-content">
                    <h4>{report.testName || "Unknown Test"}</h4>
                    <p><strong>Patient:</strong> {report.patient || "N/A"}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status-badge ${getStatusClass(report.status)}`}>
                        {report.status || "Pending"}
                      </span>
                    </p>
                    <p><strong>Created:</strong> {new Date(report.createdAt).toLocaleDateString()}</p>

                    {report.fileUrl && (
                      <div className="file-links">
                        <a
                          href={`/api${report.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="report-link"
                        >
                          <i className="fa-solid fa-file-pdf"></i> View Report
                        </a>
                        {report.fileUrl.match(/\.(jpg|jpeg|png)$/i) && (
                          <a
                            href={`/api${report.fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="report-link"
                          >
                            <i className="fa-solid fa-image"></i> View Image
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className="card-menu"
                    onClick={() =>
                      setShowMenu(showMenu === report._id ? null : report._id)
                    }
                  >
                    ⋮
                  </div>

                  {showMenu === report._id && (
                    <div className="dropdown-menu">
                      <div onClick={() => handleStarReport(report._id)}>
                        <i className="fa-solid fa-star"></i> {starredReports.includes(report._id) ? "Unstar Report" : "Star Report"}
                      </div>

                      <div onClick={() => handleViewDetails(report)}>
                        <i className="fa-solid fa-eye"></i> View Details
                      </div>

                      {canUploadReport && (
                        <div onClick={() => openUploadModal(report)}>
                          <i className="fa-solid fa-upload"></i> Upload Report
                        </div>
                      )}

                      {canRemoveReport && (
                        <div className="danger" onClick={() => handleRemoveReport(report._id)}>
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
              <i className="fa-solid fa-flask-vial"></i>
              <p>No lab reports found</p>
            </div>
          )}
        </div>
      </div>

      {/* View Report Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Lab Report Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="patient-details">
              <div className="detail-row">
                <strong>Test Name:</strong>
                <span>{selectedReport.testName || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Patient:</strong>
                <span>{selectedReport.patient || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span>{selectedReport.status || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Created Date:</strong>
                <span>{selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleDateString() : "N/A"}</span>
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

      {/* Add Lab Test Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Lab Test</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddReport}>
              <div className="form-group">
                <label>Patient Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="patient"
                  value={newReport.patient}
                  onChange={(e) => setNewReport({ ...newReport, patient: e.target.value })}
                  placeholder="Enter patient name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Test Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="testName"
                  value={newReport.testName}
                  onChange={(e) => setNewReport({ ...newReport, testName: e.target.value })}
                  placeholder="e.g., Blood Test, Urine Analysis, CBC"
                  required
                />

              </div>

              <div className="modal-actions">
                <button type="submit" className="primary-btn lab-btn" disabled={saving}>
                  {saving ? "Ordering..." : "Order Test"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Report Modal */}
      {showUploadModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Lab Report</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            <div className="patient-details">
              <div className="detail-row">
                <strong>Patient:</strong>
                <span>{selectedReport.patient || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Test:</strong>
                <span>{selectedReport.testName || "N/A"}</span>
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
                className="primary-btn lab-btn" 
                onClick={() => handleUploadFile(selectedReport._id)}
                disabled={uploading || !selectedFile}
              >
                {uploading ? "Uploading..." : "Upload Report"}
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
        .lab-btn {
          background: #7c3aed;
        }
        .lab-btn:hover:not(:disabled) {
          background: #6d28d9;
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

export default Lab;

