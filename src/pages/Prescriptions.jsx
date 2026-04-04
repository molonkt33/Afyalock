import React, { useState, useEffect } from "react";
import { getInitials } from "../utils/getInitials";
import "../styles/Prescriptions.css";
import { getPrescriptions, createPrescription } from "../services/prescriptionService.js";
import { getPatients } from "../services/patientService.js";

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("card");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [starredPrescriptions, setStarredPrescriptions] = useState([]);
  const [selectedPrescriptionForView, setSelectedPrescriptionForView] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // New prescription form state
  const [newPrescription, setNewPrescription] = useState({
    patient: "",
    medications: [],
    notes: ""
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentMedication, setCurrentMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    quantity: "",
    instructions: ""
  });
  const [patientSearch, setPatientSearch] = useState("");

  const role = localStorage.getItem("role") || "guest";
  const token = localStorage.getItem("token");

  // Role access: reception, doctor, nurse, admin can manage; others view
  const canManage = ["reception", "doctor", "nurse", "admin"].includes(role);
  const canView = canManage || ["lab", "radiology", "emergency"].includes(role);

  useEffect(() => {
    if (!token || !canView) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [prescriptionsRes, patientsRes] = await Promise.all([
          getPrescriptions(),
          getPatients()
        ]);
        
        setPrescriptions(prescriptionsRes.data || []);
        setPatients(patientsRes.data || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, role]);

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter(p => 
    p.patientFullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.patient?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    p.medications.some(m => m.name.toLowerCase().includes(search.toLowerCase()))
  );

  // Handle patient search
  const filteredPatients = patients.filter(patient =>
    patient.fullName?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setNewPrescription(prev => ({ ...prev, patient: patient._id }));
    setPatientSearch("");
  };

  const addMedication = (e) => {
    e.preventDefault();
    if (!currentMedication.name || !currentMedication.dosage || !currentMedication.frequency || !currentMedication.duration || !currentMedication.quantity) {
      alert("Please fill all medication fields");
      return;
    }

    setNewPrescription(prev => ({
      ...prev,
      medications: [...prev.medications, { ...currentMedication }]
    }));
    
    // Reset form
    setCurrentMedication({
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      quantity: "",
      instructions: ""
    });
  };

  const removeMedication = (index) => {
    setNewPrescription(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (!newPrescription.patient || newPrescription.medications.length === 0) {
      alert("Please select a patient and add at least one medication");
      return;
    }

    setSaving(true);
    try {
      const result = await createPrescription(newPrescription);
      setPrescriptions([result.data, ...prescriptions]);
      setShowAddModal(false);
      setNewPrescription({ patient: "", medications: [], notes: "" });
      setSelectedPatient(null);
      alert("Prescription created successfully!");
    } catch (error) {
      console.error("Error creating prescription:", error);
      alert(error.response?.data?.message || "Failed to create prescription");
    } finally {
      setSaving(false);
    }
  };

  const getStatusClass = (status) => {
    const classes = {
      Active: "status-active",
      Dispensed: "status-dispensed",
      Completed: "status-completed",
      Cancelled: "status-cancelled"
    };
    return classes[status] || "";
  };

  const getPharmacyClass = (status) => {
    const classes = {
      Pending: "pharmacy-pending",
      Dispensed: "pharmacy-dispensed"
    };
    return classes[status] || "";
  };

  const handleStarPrescription = (prescriptionId) => {
    const prescriptionKey = prescriptionId;
    if (starredPrescriptions.includes(prescriptionKey)) {
      setStarredPrescriptions(starredPrescriptions.filter(id => id !== prescriptionKey));
    } else {
      setStarredPrescriptions([...starredPrescriptions, prescriptionKey]);
    }
    setShowMenu(null);
  };

  const handleViewPrescription = (prescription) => {
    setSelectedPrescriptionForView(prescription);
    setShowDetailsModal(true);
    setShowMenu(null);
  };

  const handleDeletePrescription = (prescriptionId) => {
    if (!window.confirm("Are you sure you want to delete this prescription?")) {
      setShowMenu(null);
      return;
    }
    setPrescriptions(prescriptions.filter(p => (p._id || p.id) !== prescriptionId));
    setShowMenu(null);
  };

  if (!canView) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center p-5">
          <i className="fa-solid fa-lock fa-3x text-muted mb-4"></i>
          <h3>Access Denied</h3>
          <p>You don't have permission to view prescriptions.</p>
          <p className="text-muted">Contact administrator for access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <div className="flex-grow-1 p-5">
        {/* Header */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>
              <i className="fa-solid fa-prescription-bottle me-2"></i>
              Prescriptions
            </h2>
            
            {canManage && (
              <button 
                className="primary-btn" 
                onClick={() => setShowAddModal(true)}
              >
                <i className="fa-solid fa-plus"></i> New Prescription
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="controls">
            <input
              className="search-bar"
              placeholder="Search by patient or medication..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="view-toggle">
              <button 
                className={`view-toggle-btn ${view === "card" ? "active" : ""}`}
                onClick={() => setView("card")}
              >
                <i className="fa-solid fa-grid-2"></i>
              </button>
              <button 
                className={`view-toggle-btn ${view === "table" ? "active" : ""}`}
                onClick={() => setView("table")}
              >
                <i className="fa-solid fa-table-list"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-state text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading prescriptions...</p>
          </div>
        ) : view === "table" ? (
          <div className="prescription-table">
            <div className="table-header">
              <h4>Prescription Records</h4>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Medications</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Prescribed By</th>
                  <th>Pharmacy</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrescriptions.map((prescription) => (
                  <tr key={prescription._id || prescription.id}>
                    <td>
                      <strong>{prescription.patientFullName || prescription.patient?.firstName + " " + prescription.patient?.lastName || "Unknown"}</strong>
                    </td>
                    <td>
                      <div className="medications-cell">
                        {prescription.medications.slice(0, 3).map((med, idx) => (
                          <span key={idx} className="medication-tag">{med.name} ({med.dosage})</span>
                        ))}
                        {prescription.medications.length > 3 && "..."}
                      </div>
                    </td>
                    <td><span className={`status-badge ${getStatusClass(prescription.status)}`}>{prescription.status}</span></td>
                    <td>{new Date(prescription.datePrescribed).toLocaleDateString()}</td>
                    <td>{prescription.prescribedBy?.fullName || "N/A"}</td>
                    <td><span className={`pharmacy-badge ${getPharmacyClass(prescription.pharmacyStatus)}`}>{prescription.pharmacyStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card-grid">
            {filteredPrescriptions.map((prescription) => (
              <div key={prescription._id || prescription.id} className="prescription-card">
                <div className="prescription-header">
                  <div className="prescription-icon">
                    <i className="fa-solid fa-prescription-bottle"></i>
                  </div>
                  <div>
                    <h4>{prescription.patientFullName || "Unknown Patient"}</h4>
                    <span className={`status-badge ${getStatusClass(prescription.status)}`}>
                      {prescription.status}
                    </span>
                    <span className={`pharmacy-badge ${getPharmacyClass(prescription.pharmacyStatus)}`}>
                      {prescription.pharmacyStatus}
                    </span>
                  </div>
                </div>

                <div className="medication-list">
                  {prescription.medications.map((med, idx) => (
                    <div key={idx} className="medication-item">
                      <strong>{med.name}</strong> - {med.dosage} 
                      <span className="prescription-date">({med.frequency}, {med.duration})</span>
                    </div>
                  ))}
                </div>

                <div className="prescription-date">
                  <i className="fa-solid fa-calendar me-1"></i>
                  {new Date(prescription.datePrescribed).toLocaleDateString()}
                </div>

                {prescription.notes && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '14px' }}>
                    <strong>Notes:</strong> {prescription.notes}
                  </div>
                )}

                <div
                  className="card-menu"
                  onClick={() =>
                    setShowMenu(showMenu === (prescription._id || prescription.id) ? null : prescription._id || prescription.id)
                  }
                >
                  ⋮
                </div>

                {showMenu === (prescription._id || prescription.id) && (
                  <div className="dropdown-menu">
                    <div onClick={() => handleStarPrescription(prescription._id || prescription.id)}>
                      <i className="fa-solid fa-star"></i> {starredPrescriptions.includes(prescription._id || prescription.id) ? "Unstar" : "Star"}
                    </div>

                    <div onClick={() => handleViewPrescription(prescription)}>
                      <i className="fa-solid fa-eye"></i> View Details
                    </div>

                    {canManage && (
                      <div onClick={() => window.alert("Edit functionality to be implemented")}>
                        <i className="fa-solid fa-edit"></i> Edit
                      </div>
                    )}

                    {canManage && (
                      <div className="danger" onClick={() => handleDeletePrescription(prescription._id || prescription.id)}>
                        <i className="fa-solid fa-trash"></i> Remove
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && filteredPrescriptions.length === 0 && (
          <div className="empty-prescriptions">
            <i className="fa-solid fa-prescription-bottle-medical empty-icon"></i>
            <h4>No Prescriptions Found</h4>
            <p>No prescription records match your search or available for your role.</p>
            {canManage && (
              <button className="primary-btn mt-3" onClick={() => setShowAddModal(true)}>
                Create First Prescription
              </button>
            )}
          </div>
        )}
      </div>

      {/* View Prescription Details Modal */}
      {showDetailsModal && selectedPrescriptionForView && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Prescription Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="patient-details">
              <div className="detail-row">
                <strong>Patient:</strong>
                <span>{selectedPrescriptionForView.patientFullName || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span className={`status-badge ${getStatusClass(selectedPrescriptionForView.status)}`}>
                  {selectedPrescriptionForView.status}
                </span>
              </div>
              <div className="detail-row">
                <strong>Pharmacy Status:</strong>
                <span className={`pharmacy-badge ${getPharmacyClass(selectedPrescriptionForView.pharmacyStatus)}`}>
                  {selectedPrescriptionForView.pharmacyStatus}
                </span>
              </div>
              <div className="detail-row">
                <strong>Date Prescribed:</strong>
                <span>{new Date(selectedPrescriptionForView.datePrescribed).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <strong>Prescribed By:</strong>
                <span>{selectedPrescriptionForView.prescribedBy?.fullName || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Medications:</strong>
                <div>
                  {selectedPrescriptionForView.medications.map((med, idx) => (
                    <div key={idx} style={{ marginTop: idx > 0 ? '8px' : '0' }}>
                      <strong>{med.name}</strong> - {med.dosage}
                      <br />
                      <small>Frequency: {med.frequency}, Duration: {med.duration}, Qty: {med.quantity}</small>
                      {med.instructions && <><br /><small>Instructions: {med.instructions}</small></>}
                    </div>
                  ))}
                </div>
              </div>
              {selectedPrescriptionForView.notes && (
                <div className="detail-row">
                  <strong>Notes:</strong>
                  <span>{selectedPrescriptionForView.notes}</span>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Prescription Modal */}
      {showAddModal && (
        <div className="modal-overlay prescription-modal" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h3>
                <i className="fa-solid fa-prescription-bottle me-2"></i>
                New Prescription
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreatePrescription}>
              {/* Patient Selection */}
              <div className="form-group">
                <label>Patient <span style={{color: 'red'}}>*</span></label>
                <div className="patient-select">
                  <input
                    type="text"
                    className="form-control patient-search"
                    placeholder="Search patient by name..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setSelectedPatient(null);
                      setNewPrescription(prev => ({ ...prev, patient: "" }));
                    }}
                    autoComplete="off"
                  />
                  <i className="fa-solid fa-magnifying-glass search-icon"></i>
                </div>
                
                {patientSearch && (
                  <div className="dropdown-menu" style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto',
                    position: 'absolute',
                    width: '100%',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    zIndex: 1000,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}>
                    {filteredPatients.slice(0, 5).map((patient) => (
                      <div
                        key={patient._id}
                        className="dropdown-item"
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div style={{ fontWeight: '600', color: '#05254d' }}>
                          {patient.fullName || `${patient.firstName} ${patient.lastName}`}
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                          {patient.phone} {patient.diagnosis && `- ${patient.diagnosis}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedPatient && (
                  <div style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: '#f0f9ff',
                    borderRadius: '8px',
                    border: '1px solid #0ea5e9'
                  }}>
                    <strong>Selected:</strong> {selectedPatient.fullName} ({selectedPatient.phone})
                  </div>
                )}
              </div>

              {/* Medications */}
              <div className="form-group">
                <label>Medications <span style={{color: 'red'}}>*</span></label>
                
                {/* Add Medication Form */}
                <div className="medication-form">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Medication Name *"
                      value={currentMedication.name}
                      onChange={(e) => setCurrentMedication({ ...currentMedication, name: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Dosage * (e.g., 500mg)"
                      value={currentMedication.dosage}
                      onChange={(e) => setCurrentMedication({ ...currentMedication, dosage: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Frequency * (e.g., 2x daily)"
                      value={currentMedication.frequency}
                      onChange={(e) => setCurrentMedication({ ...currentMedication, frequency: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Duration * (e.g., 7 days)"
                      value={currentMedication.duration}
                      onChange={(e) => setCurrentMedication({ ...currentMedication, duration: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Quantity *"
                      value={currentMedication.quantity}
                      onChange={(e) => setCurrentMedication({ ...currentMedication, quantity: parseFloat(e.target.value) || "" })}
                      min="0"
                      required
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Instructions"
                      value={currentMedication.instructions}
                      onChange={(e) => setCurrentMedication({ ...currentMedication, instructions: e.target.value })}
                    />
                  </div>
                  <button type="button" className="add-medication-btn" onClick={addMedication}>
                    <i className="fa-solid fa-plus me-2"></i>Add Medication
                  </button>
                </div>

                {/* Preview Added Medications */}
                {newPrescription.medications.length > 0 && (
                  <div className="medications-preview">
                    <strong>Added Medications ({newPrescription.medications.length}):</strong>
                    {newPrescription.medications.map((med, index) => (
                      <div key={index} className="medication-row">
                        <div style={{ flex: 1 }}>
                          <strong>{med.name}</strong> - {med.dosage} ({med.frequency})
                          <br />
                          <small>Qty: {med.quantity} | {med.duration} | {med.instructions}</small>
                        </div>
                        <button 
                          type="button" 
                          className="remove-med"
                          onClick={() => removeMedication(index)}
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={newPrescription.notes}
                  onChange={(e) => setNewPrescription({ ...newPrescription, notes: e.target.value })}
                  placeholder="Additional instructions or notes..."
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-save me-2"></i>
                      Create Prescription
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
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
          padding: 20px;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 0 24px;
          margin-bottom: 20px;
        }
.modal-header h3 {
          margin: 0;
          color: #000000;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #94a3b8;
          line-height: 1;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-close:hover {
          color: #ef4444;
        }
        .form-control {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
.form-control:focus {
          outline: none;
          border-color: #000000;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
        }
.form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #000000;
        }
        .modal-actions {
          display: flex;
          gap: 12px;
          padding: 24px;
          border-top: 1px solid #e2e8f0;
          justify-content: flex-end;
        }
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        .btn-secondary {
          background: #e2e8f0;
          color: #475569;
        }
        .btn-secondary:hover:not(:disabled) {
          background: #cbd5e1;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .dashboard-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          margin-bottom: 24px;
        }
        .dashboard-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
.dashboard-card-header h2 {
          margin: 0;
          color: #000000;
          font-size: 28px;
        }
        .controls {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        .search-bar {
          flex: 1;
          min-width: 300px;
          max-width: 400px;
        }
        .view-toggle {
          display: flex;
          gap: 4px;
        }
        .view-toggle-btn {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .view-toggle-btn.active,
        .view-toggle-btn:hover {
          background: #05254d;
          color: white;
          border-color: #05254d;
        }
        .primary-btn {
          background: #05254d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }
        .primary-btn:hover:not(:disabled) {
          background: #0a3d6e;
        }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 24px;
        }
        @media (max-width: 768px) {
          .card-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .controls {
            flex-direction: column;
            align-items: stretch;
          }
          .search-bar {
            min-width: auto;
            max-width: none;
          }
          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Prescriptions;

