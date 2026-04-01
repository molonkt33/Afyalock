import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ActivePatients.css";

function Records() {
  const [activePatients, setActivePatients] = useState([]);
  const [patientHistory, setPatientHistory] = useState([]);
  const [outPatients, setOutPatients] = useState([]);
  const [emergencyCases, setEmergencyCases] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [radiologyScans, setRadiologyScans] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  // Route mapping for record types
  const getRouteForRecordType = (recordType) => {
    const routeMap = {
      "Active Patient": "/active-patients",
      "Patient History": "/patient-history", 
      "OutPatient": "/outpatients",
      "Emergency": "/emergency",
      "Lab Report": "/lab",
      "Radiology": "/radiology"
    };
    return routeMap[recordType] || "/records";
  };

  const handleRowClick = (record) => {
    const route = getRouteForRecordType(record.recordType);
    const patientName = record.fullName || record.patient || record.name || "";
    if (patientName) {
      navigate(`${route}?search=${encodeURIComponent(patientName)}`);
    } else {
      navigate(route);
    }
  };

  // Role-based access
  const canViewPatients = ["admin", "doctor", "nurse", "reception", "lab", "radiology", "emergency"].includes(role);
  const canViewHistory = ["admin", "doctor", "nurse"].includes(role);
  const canViewOutPatients = ["admin", "doctor", "nurse", "reception", "lab", "radiology", "emergency"].includes(role);
  const canViewEmergency = ["admin", "doctor", "nurse", "emergency", "reception", "lab", "radiology"].includes(role);
  const canViewLab = ["admin", "doctor", "nurse", "lab", "reception", "radiology", "emergency"].includes(role);
  const canViewRadiology = ["admin", "doctor", "nurse", "radiology", "reception", "lab", "emergency"].includes(role);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    Promise.all([
      canViewPatients ? import("../services/api").then(m => m.default.get("/patients/active")) : Promise.resolve({ data: [] }),
      canViewHistory ? import("../services/api").then(m => m.default.get("/patients/history")) : Promise.resolve({ data: [] }),
      canViewOutPatients ? import("../services/api").then(m => m.default.get("/outpatients")) : Promise.resolve({ data: [] }),
      canViewEmergency ? import("../services/api").then(m => m.default.get("/emergency")) : Promise.resolve({ data: [] }),
      canViewLab ? import("../services/api").then(m => m.default.get("/labs?page=1&limit=50")) : Promise.resolve({ data: { data: [] } }),
      canViewRadiology ? import("../services/api").then(m => m.default.get("/radiology")) : Promise.resolve({ data: [] }),
    ])
      .then(([activeRes, historyRes, outRes, emergencyRes, labRes, radioRes]) => {
        if (canViewPatients) {
          const data = activeRes.data;
          setActivePatients(Array.isArray(data) ? data : (data.data || []));
        }
        if (canViewHistory) {
          const data = historyRes.data;
          setPatientHistory(Array.isArray(data) ? data : (data.data || []));
        }
        if (canViewOutPatients) {
          const data = outRes.data;
          setOutPatients(Array.isArray(data) ? data : (data.data || []));
        }
        if (canViewEmergency) {
          const data = emergencyRes.data;
          setEmergencyCases(Array.isArray(data) ? data : (data.data || []));
        }
        if (canViewLab) {
          const data = labRes.data;
          setLabReports(Array.isArray(data) ? data : (data.data || []));
        }
        if (canViewRadiology) {
          const data = radioRes.data;
          setRadiologyScans(Array.isArray(data) ? data : (data.data || []));
        }
      })
      .catch((err) => {
        console.error("Error fetching records:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("user");
          navigate("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [token, navigate, canViewPatients, canViewHistory, canViewOutPatients, canViewEmergency, canViewLab, canViewRadiology]);

  // Combine all records with type
  const allRecords = [
    ...activePatients.map(p => ({ ...p, recordType: "Active Patient", status: "Admitted" })),
    ...patientHistory.map(p => ({ ...p, recordType: "Patient History", status: p.status || "Discharged" })),
    ...outPatients.map(p => ({ ...p, recordType: "OutPatient", status: p.status || "Pending" })),
    ...emergencyCases.map(c => ({ ...c, recordType: "Emergency", status: c.status || "Pending" })),
    ...labReports.map(l => ({ ...l, recordType: "Lab Report", status: l.status || "Pending", fullName: l.patient })),
    ...radiologyScans.map(r => ({ ...r, recordType: "Radiology", status: r.status || "Pending", fullName: r.patient })),
  ];

  // Filter based on active tab
  const getFilteredRecords = () => {
    let records = allRecords;
    
    if (activeTab !== "all") {
      records = records.filter(r => r.recordType.toLowerCase().includes(activeTab.toLowerCase()));
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      records = records.filter(r => 
        r.fullName?.toLowerCase().includes(searchLower) ||
        r.recordType?.toLowerCase().includes(searchLower) ||
        r.diagnosis?.toLowerCase().includes(searchLower) ||
        r.reason?.toLowerCase().includes(searchLower) ||
        r.condition?.toLowerCase().includes(searchLower) ||
        r.testName?.toLowerCase().includes(searchLower) ||
        r.scanType?.toLowerCase().includes(searchLower)
      );
    }
    
    return records;
  };

  const filteredRecords = getFilteredRecords();

  // Get tab counts
  const getTabCount = (tab) => {
    if (tab === "all") return allRecords.length;
    if (tab === "active") return activePatients.length;
    if (tab === "history") return patientHistory.length;
    if (tab === "outpatient") return outPatients.length;
    if (tab === "emergency") return emergencyCases.length;
    if (tab === "lab") return labReports.length;
    if (tab === "radiology") return radiologyScans.length;
    return 0;
  };

  return (
    <div className="d-flex">
      <div className="flex-grow-1 p-3 p-md-4">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Medical Records</h2>
            <span className="record-count">{filteredRecords.length} Records</span>
          </div>

          {/* Tabs */}
          <div className="records-tabs">
            <button 
              className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Records <span className="tab-count">{getTabCount("all")}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
              onClick={() => setActiveTab("active")}
            >
              Active <span className="tab-count">{getTabCount("active")}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              History <span className="tab-count">{getTabCount("history")}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === "outpatient" ? "active" : ""}`}
              onClick={() => setActiveTab("outpatient")}
            >
              OutPatients <span className="tab-count">{getTabCount("outpatient")}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === "emergency" ? "active" : ""}`}
              onClick={() => setActiveTab("emergency")}
            >
              Emergency <span className="tab-count">{getTabCount("emergency")}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === "lab" ? "active" : ""}`}
              onClick={() => setActiveTab("lab")}
            >
              Lab <span className="tab-count">{getTabCount("lab")}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === "radiology" ? "active" : ""}`}
              onClick={() => setActiveTab("radiology")}
            >
              Radiology <span className="tab-count">{getTabCount("radiology")}</span>
            </button>
          </div>

          <div className="controls">
            <input
              className="search-bar"
              placeholder="Search all records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-view">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Record Type</th>
                    <th>Details</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => {
                    const patientName = record.fullName || record.patient || record.name || "Unknown";
                    return (
                      <tr 
                        key={record._id || record.id || index}
                        className="record-row"
                        onClick={() => handleRowClick(record)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td><strong>{patientName}</strong></td>
                        <td>
                          <span className={`record-type-badge ${record.recordType.toLowerCase().replace(/ /g, "-")}`}>
                            {record.recordType}
                          </span>
                        </td>
                        <td>
                          {record.diagnosis || record.reason || record.condition || record.testName || record.scanType || "N/A"}
                        </td>
                        <td>
                          {record.admissionDate || record.dischargeDate || record.visitDate || record.arrivalTime || record.createdAt ? 
                            new Date(record.admissionDate || record.dischargeDate || record.visitDate || record.arrivalTime || record.createdAt).toLocaleDateString() 
                            : "N/A"}
                        </td>
                        <td>
                          <span className={`status-badge ${record.status?.toLowerCase() || "pending"}`}>
                            {record.status || "Pending"}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button 
                              className="action-btn" 
                              title="View Details"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(record);
                              }}
                            >
                              <i className="fa-solid fa-eye"></i>
                            </button>
                            {(role === "admin" || role === "doctor") && (
                              <button className="action-btn" title="Edit">
                                <i className="fa-solid fa-pen"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredRecords.length === 0 && (
            <div className="empty-state">
              <i className="fa-solid fa-folder-open"></i>
              <p>No records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Records;

