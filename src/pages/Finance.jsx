import React, { useState, useEffect } from "react";
import { getInitials } from "../utils/getInitials";
import "../styles/Prescriptions.css"; // Reuse payment cards
import { getPayments, createPayment, initiateMpesaSTK, queryMpesaSTKStatus } from "../services/financeService.js";
import { getPatients, getPrescriptions } from "../services/patientService.js"; // For dropdowns

const Finance = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("card");
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [starredPayments, setStarredPayments] = useState([]);
  const [selectedPaymentForView, setSelectedPaymentForView] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  // M-Pesa STK state
  const [stkStatus, setStkStatus] = useState(null);
  const [checkoutRequestID, setCheckoutRequestID] = useState(null);
  const [stkLoading, setStkLoading] = useState(false);

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

  // Handle M-Pesa STK Payment
  const handleMpesaPayment = async (e) => {
    e.preventDefault();
    
    if (!newPayment.amount || !newPayment.patient || !newPayment.invoiceNumber) {
      alert("Amount, patient and invoice required");
      return;
    }

    if (!newPayment.mpesaPhone) {
      alert("M-Pesa phone number required");
      return;
    }

    setStkLoading(true);
    setStkStatus(null);
    
    try {
      console.log("📱 Initiating M-Pesa STK...");
      
      // Initiate STK Push
      const stkResponse = await initiateMpesaSTK(
        newPayment.mpesaPhone,
        Math.round(newPayment.amount),
        newPayment.invoiceNumber
      );

      console.log("✅ STK Response:", stkResponse);

      if (stkResponse.success) {
        setCheckoutRequestID(stkResponse.data.checkoutRequestID);
        setStkStatus("initiated");
        
        // Show notification
        alert(`✅ M-Pesa prompt sent to ${newPayment.mpesaPhone}. Please enter your PIN to complete payment.`);

        // Poll status for 30 seconds
        let pollCount = 0;
        const pollInterval = setInterval(async () => {
          pollCount++;
          try {
            const statusResponse = await queryMpesaSTKStatus(stkResponse.data.checkoutRequestID);
            
            if (statusResponse.data.isSuccess) {
              clearInterval(pollInterval);
              setStkStatus("success");
              
              // Now create payment in database with status "paid"
              const paymentData = {
                ...newPayment,
                status: "paid",
                mpesaRef: statusResponse.data.mpesaReceiptNumber
              };

              const result = await createPayment(paymentData);
              setPayments([result.data, ...payments]);
              
              alert("✅ Payment successful! M-Pesa transaction completed.");
              
              // Reset form
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
              setCheckoutRequestID(null);
              setStkStatus(null);
            } else if (statusResponse.data.resultCode !== "0" && pollCount > 30) {
              // Payment failed or timeout
              clearInterval(pollInterval);
              setStkStatus("failed");
              alert("❌ Payment failed or timeout. Please try again.");
              
              // Still save as pending if user wants
              const confirmSave = window.confirm("Save payment as pending?");
              if (confirmSave) {
                const result = await createPayment({
                  ...newPayment,
                  status: "pending"
                });
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
              }
            }
          } catch (err) {
            console.error("Error polling status:", err);
          }
        }, 2000); // Poll every 2 seconds

        // Stop polling after 30 polls (60 seconds)
        setTimeout(() => clearInterval(pollInterval), 60000);
      }
    } catch (error) {
      console.error("❌ M-Pesa Error:", error);
      setStkStatus("failed");
      
      // Ask if user wants to save as pending
      const confirmSave = window.confirm(
        `M-Pesa prompt failed: ${error.response?.data?.message || error.message}\n\nSave payment as pending?`
      );
      
      if (confirmSave) {
        try {
          const result = await createPayment({
            ...newPayment,
            status: "pending"
          });
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
          alert("Payment saved as pending.");
        } catch (err) {
          alert("Error saving payment");
        }
      }
    } finally {
      setStkLoading(false);
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    
    // If M-Pesa, use STK flow
    if (newPayment.paymentMethod === "mpesa") {
      handleMpesaPayment(e);
      return;
    }

    // For non-M-Pesa payments
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

  const handleStarPayment = (paymentId) => {
    const paymentKey = paymentId;
    if (starredPayments.includes(paymentKey)) {
      setStarredPayments(starredPayments.filter(id => id !== paymentKey));
    } else {
      setStarredPayments([...starredPayments, paymentKey]);
    }
    setShowMenu(null);
  };

  const handleViewPayment = (payment) => {
    setSelectedPaymentForView(payment);
    setShowDetailsModal(true);
    setShowMenu(null);
  };

  const handleDeletePayment = (paymentId) => {
    if (!window.confirm("Are you sure you want to delete this payment record?")) {
      setShowMenu(null);
      return;
    }
    setPayments(payments.filter(p => p._id !== paymentId));
    setShowMenu(null);
  };

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
                <i className="fa-solid fa-plus"></i> Record Payment
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
                  
                  <div
                    className="card-menu"
                    onClick={() =>
                      setShowMenu(showMenu === payment._id ? null : payment._id)
                    }
                  >
                    ⋮
                  </div>

                  {showMenu === payment._id && (
                    <div className="dropdown-menu">
                      <div onClick={() => handleStarPayment(payment._id)}>
                        <i className="fa-solid fa-star"></i> {starredPayments.includes(payment._id) ? "Unstar" : "Star"}
                      </div>

                      <div onClick={() => handleViewPayment(payment)}>
                        <i className="fa-solid fa-eye"></i> View Details
                      </div>

                      {canManage && (
                        <div onClick={() => window.alert("Edit functionality to be implemented")}>
                          <i className="fa-solid fa-edit"></i> Edit
                        </div>
                      )}

                      {canManage && (
                        <div className="danger" onClick={() => handleDeletePayment(payment._id)}>
                          <i className="fa-solid fa-trash"></i> Remove
                        </div>
                      )}
                    </div>
                  )}
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
                Record First Payment
              </button>
            )}
          </div>
        )}
      </div>

      {/* View Payment Details Modal */}
      {showDetailsModal && selectedPaymentForView && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Payment Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="patient-details">
              <div className="detail-row">
                <strong>Invoice Number:</strong>
                <span>#{selectedPaymentForView.invoiceNumber}</span>
              </div>
              <div className="detail-row">
                <strong>Patient:</strong>
                <span>{selectedPaymentForView.patientFullName || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Amount:</strong>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#05254d' }}>
                  ₭ {selectedPaymentForView.amount.toLocaleString()}
                </span>
              </div>
              <div className="detail-row">
                <strong>Payment Method:</strong>
                <span>
                  <i className={getMethodIcon(selectedPaymentForView.paymentMethod)} style={{ marginRight: '8px', color: getMethodColor(selectedPaymentForView.paymentMethod) }}></i>
                  {selectedPaymentForView.paymentMethod.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span className={`status-badge ${selectedPaymentForView.status === 'paid' ? 'status-active' : 'status-dispensed'}`}>
                  {selectedPaymentForView.status.toUpperCase()}
                </span>
              </div>
              <div className="detail-row">
                <strong>Date:</strong>
                <span>{new Date(selectedPaymentForView.createdAt).toLocaleDateString()}</span>
              </div>
              {selectedPaymentForView.mpesaPhone && (
                <div className="detail-row">
                  <strong>M-Pesa Phone:</strong>
                  <span>{selectedPaymentForView.mpesaPhone}</span>
                </div>
              )}
              {selectedPaymentForView.notes && (
                <div className="detail-row">
                  <strong>Notes:</strong>
                  <span>{selectedPaymentForView.notes}</span>
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

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !stkLoading && setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3><i className="fa-solid fa-plus me-2"></i>New Payment Record</h3>
              <button className="modal-close" onClick={() => !stkLoading && setShowAddModal(false)} disabled={stkLoading}>×</button>
            </div>

            {/* STK Status Alert */}
            {stkStatus && (
              <div style={{
                padding: '12px 16px',
                margin: '0 0 16px 0',
                borderRadius: '8px',
                fontSize: '14px',
                ...(stkStatus === 'initiated' ? {
                  background: '#dbeafe',
                  color: '#1e40af',
                  border: '1px solid #93c5fd'
                } : stkStatus === 'success' ? {
                  background: '#dcfce7',
                  color: '#166534',
                  border: '1px solid #86efac'
                } : {
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: '1px solid #fca5a5'
                })
              }}>
                <i className={`fa-solid ${stkStatus === 'initiated' ? 'fa-hourglass-middle' : stkStatus === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} style={{ marginRight: '8px' }}></i>
                {stkStatus === 'initiated' && '📱 M-Pesa prompt sent, waiting for PIN entry...'}
                {stkStatus === 'success' && '✅ Payment successful!'}
                {stkStatus === 'failed' && '❌ Payment failed. You can retry or save as pending.'}
              </div>
            )}

            <form onSubmit={handleCreatePayment}>
              <div className="form-group">
                <label>Invoice Number *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newPayment.invoiceNumber}
                  onChange={(e) => setNewPayment({ ...newPayment, invoiceNumber: e.target.value })}
                  required
                  disabled={stkLoading}
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
                  disabled={stkLoading}
                />
              </div>
              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  className="form-control"
                  value={newPayment.paymentMethod}
                  onChange={(e) => {
                    setNewPayment({ ...newPayment, paymentMethod: e.target.value });
                    if (e.target.value !== "mpesa") {
                      setStkStatus(null);
                      setCheckoutRequestID(null);
                    }
                  }}
                  required
                  disabled={stkLoading}
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Show M-Pesa Phone field when M-Pesa is selected */}
              {newPayment.paymentMethod === "mpesa" && (
                <div className="form-group">
                  <label>M-Pesa Phone *</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={newPayment.mpesaPhone}
                    onChange={(e) => setNewPayment({ ...newPayment, mpesaPhone: e.target.value })}
                    placeholder="2547XXXXXXXX (e.g., 254712345678)"
                    required
                    disabled={stkLoading}
                  />
                  <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                    💡 Format: 254XXXXXXXXX or 07XXXXXXXX (Kenya)
                  </small>
                </div>
              )}

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
                  disabled={stkLoading}
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
                  disabled={stkLoading}
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
                  disabled={stkLoading}
                />
              </div>

              {/* Get patient options for autocomplete */}
              {patientSearch && !selectedPatient && patients.length > 0 && (
                <div style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  margin: '-4px 0 12px 0'
                }}>
                  {patients
                    .filter(p => p.fullName?.toLowerCase().includes(patientSearch.toLowerCase()))
                    .map(patient => (
                      <div
                        key={patient._id}
                        onClick={() => handlePatientSelect(patient)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#efefef'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <strong>{patient.fullName}</strong> • {patient.phone}
                      </div>
                    ))}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={stkLoading || (newPayment.paymentMethod === "mpesa" && stkStatus === "success")}
                  style={{
                    opacity: stkLoading ? 0.6 : 1,
                    cursor: stkLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {stkLoading ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin" style={{ marginRight: '8px' }}></i>
                      Processing...
                    </>
                  ) : newPayment.paymentMethod === "mpesa" ? (
                    <>
                      <i className="fa-solid fa-mobile-screen-button" style={{ marginRight: '8px' }}></i>
                      Send M-Pesa Prompt
                    </>
                  ) : (
                    'Save Payment'
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={stkLoading}
                >
                  {stkLoading ? 'Wait...' : 'Cancel'}
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Finance;

