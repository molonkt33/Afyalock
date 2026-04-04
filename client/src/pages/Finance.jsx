import React, { useState, useEffect } from "react";
import { getInitials } from "../utils/getInitials";
import "../styles/Prescriptions.css"; // Reuse payment cards
import { getPayments, createPayment } from "../services/financeService.js";
import { getPatients, getPrescriptions } from "../services/patientService.js"; // For dropdowns

const Finance = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("card");
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  // New payment form
  const [newPayment, setNewPayment] = useState({
    amount: "",
    paymentMethod: "mpesa",
    patient: "",
    prescription: "",
    invoiceNumber: "",
    mpesaPhone: "",
    notes: ""
  });

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const role = localStorage.getItem("role") || "guest";
  const canManage = ["reception", "admin"].includes(role);
  const canView = canManage;

  useEffect(() => {
    if (!canView) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [paymentsRes, patientsRes, prescriptionsRes] = await Promise.all([
          getPayments(),
          getPatients(),
          getPrescriptions()
        ]);
        setPayments(paymentsRes.data || []);
        setPatients(patientsRes.data || []);
        setPrescriptions(prescriptionsRes.data || []);
      } catch (error) {
        console.error("Error loading finance data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredPayments = payments.filter(p => 
    p.patientFullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    p.amount.toString().includes(search) ||
    (filterMethod !== "all" && p.paymentMethod === filterMethod)
  );

  const getMethodIcon = (method) => {
    const icons = {
      mpesa: "fa-solid fa-mobile-screen-button",
      cash: "fa-solid fa-money-bill-wave",
      card: "fa-solid fa-credit-card",
      paypal: "fa-brands fa-paypal",
      "bank_transfer": "fa-solid fa-building-columns"
    };
    return icons[method] || "fa-solid fa-money-bill";
  };

  const getMethodColor = (method) => {
    const colors = {
      mpesa: "#059669",
      cash: "#f59e0b",
      card: "#3b82f6",
      paypal: "#1e40af",
      "bank_transfer": "#7c3aed"
    };
    return colors[method] || "#6b7280";
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setNewPayment(prev => ({ ...prev, patient: patient._id }));
    setPatientSearch("");
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!newPayment.amount || !newPayment.patient || !newPayment.invoiceNumber) {
      alert("Amount, patient and invoice required");
      return;
    }

    setSaving(true);
    try {
      const result = await createPayment(newPayment);
      setPayments([result.data, ...payments]);
      setShowAddModal(false);
      setNewPayment({
        amount: "",
        paymentMethod: "mpesa",
        patient: "",
        prescription: "",
        invoiceNumber: "",
        mpesaPhone: "",
        notes: ""
      });
      setSelectedPatient(null);
      alert("Payment record created!");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create payment");
    } finally {
      setSaving(false);
    }
  };

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingTotal = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);

  if (!canView) {
    return (
      <div className="access-denied">
        <i className="fa-solid fa-lock"></i>
        <h3>Access Denied</h3>
        <p>Finance management is restricted to Reception and Admin.</p>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <div className="flex-grow-1 p-5">
        {/* Stats Row */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="dashboard-card text-center">
              <h3>₭ {totalRevenue.toLocaleString()}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="dashboard-card text-center text-warning">
              <h3>₭ {pendingTotal.toLocaleString()}</h3>
              <p>Pending Payments</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="dashboard-card text-center">
              <h3>{payments.length}</h3>
              <p>Total Transactions</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="dashboard-card text-center">
              <h3>{payments.filter(p => p.status === "paid").length}</h3>
              <p>Paid</p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>
              <i className="fa-solid fa-sack-dollar me-2"></i>
              Finance Management
            </h2>
            {canManage && (
              <button className="primary-btn" onClick={() => setShowAddModal(true)}>
                <i className="fa-solid fa-mobile-screen-button"></i> Send M-Pesa Prompt
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="controls">
            <input
              className="search-bar"
              placeholder="Search payments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select 
              className="form-control" 
              style={{ width: "200px" }}
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
            >
              <option value="all">All Methods</option>
              <option value="mpesa">M-Pesa</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="paypal">PayPal</option>
            </select>
            <div className="view-toggle">
              <button className={`view-toggle-btn ${view === "card" ? "active" : ""}`} onClick={() => setView("card")}>
                <i className="fa-solid fa-grid-2"></i>
              </button>
              <button className={`view-toggle-btn ${view === "table" ? "active" : ""}`} onClick={() => setView("table")}>
                <i className="fa-solid fa-table-list"></i>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner-border"></div>
          </div>
        ) : view === "table" ? (
          <div className="prescription-table">
            <div className="table-header">
              <h4>Payment Records</h4>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Patient</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td><strong>#{payment.invoiceNumber}</strong></td>
                    <td>{payment.patientFullName}</td>
                    <td>₭ {payment.amount.toLocaleString()}</td>
                    <td>
                      <i className={getMethodIcon(payment.paymentMethod)} style={{ color: getMethodColor(payment.paymentMethod) }}></i>
                      {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                    </td>
                    <td>
                      <span className={`status-badge ${payment.status === 'paid' ? 'status-active' : 'status-dispensed'}`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card-grid">
            {filteredPayments.map((payment) => (
              <div key={payment._id} className="prescription-card">
                <div className="prescription-header">
                  <div className="prescription-icon" style={{ backgroundColor: getMethodColor(payment.paymentMethod) }}>
                    <i className={getMethodIcon(payment.paymentMethod)}></i>
                  </div>
                  <div>
                    <h4>#{payment.invoiceNumber}</h4>
                    <span className={`status-badge ${payment.status === 'paid' ? 'status-active' : 'status-dispensed'}`}>
                      {payment.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#05254d', marginBottom: '8px' }}>
                    ₭ {payment.amount.toLocaleString()}
                  </div>
                  <div className="prescription-date">
                    {payment.patientFullName}
                  </div>
                  {payment.prescription && <p>Prescription: #{payment.prescription.invoiceNumber}</p>}
                  <div className="card-actions">
                    <button className="action-btn btn-view">View</button>
                    {canManage && (
                      <>
                        <button className="action-btn btn-edit">Edit</button>
                        <button className="action-btn btn-delete">Delete</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredPayments.length === 0 && (
          <div className="empty-prescriptions">
            <i className="fa-solid fa-sack-dollar fa-3x mb-3"></i>
            <h4>No Payments Found</h4>
            <p>No payment records match your filters.</p>
            {canManage && (
              <button className="primary-btn mt-3" onClick={() => setShowAddModal(true)}>
                <i className="fa-solid fa-mobile-screen-button"></i> Send M-Pesa Prompt
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fa-solid fa-mobile-screen-button me-2"></i>M-Pesa Payment Prompt</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreatePayment}>
              <div className="form-group">
                <label>Invoice Number *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newPayment.invoiceNumber}
                  onChange={(e) => setNewPayment({ ...newPayment, invoiceNumber: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount (KES) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || "" })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  className="form-control"
                  value={newPayment.paymentMethod}
                  onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                  required
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="form-group">
                <label>M-Pesa Phone (if M-Pesa)</label>
                <input
                  type="tel"
                  className="form-control"
                  value={newPayment.mpesaPhone}
                  onChange={(e) => setNewPayment({ ...newPayment, mpesaPhone: e.target.value })}
                  placeholder="2547XXXXXXXX"
                />
              </div>
              <div className="form-group">
                <label>Patient *</label>
                <input
                  type="text"
                  className="form-control patient-search"
                  placeholder="Search patient..."
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setSelectedPatient(null);
                    setNewPayment(prev => ({ ...prev, patient: "" }));
                  }}
                />
                {selectedPatient && (
                  <div style={{ marginTop: '8px', padding: '12px', background: '#f0f9ff', borderRadius: '8px' }}>
                    <strong>{selectedPatient.fullName}</strong> ({selectedPatient.phone})
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Prescription (Optional)</label>
                <select
                  className="form-control"
                  value={newPayment.prescription}
                  onChange={(e) => setNewPayment({ ...newPayment, prescription: e.target.value })}
                >
                  <option value="">No Prescription</option>
                  {prescriptions.map((prescription) => (
                    <option key={prescription._id} value={prescription._id}>
                      #{prescription._id.slice(-6)} - {prescription.patientFullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Saving..." : "Save Payment"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .row { display: flex; gap: 24px; flex-wrap: wrap; margin: 0 -12px; }
        .col-md-3 { flex: 1 1 calc(25% - 24px); padding: 0 12px; }
        @media (max-width: 768px) { 
          .col-md-3 { flex: 1 1 100%; }
        }
      `}</style>
    </div>
  );
};

export default Finance;

