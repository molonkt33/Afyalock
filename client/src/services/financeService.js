import api from "./api";

// Get all payments
export const getPayments = async () => {
  const { data } = await api.get("/finance/payments");
  return data;
};

// Get payment by ID
export const getPaymentById = async (id) => {
  const { data } = await api.get(`/finance/payments/${id}`);
  return data;
};

// Create new payment
export const createPayment = async (paymentData) => {
  const { data } = await api.post("/finance/payments", paymentData);
  return data;
};

// Update payment
export const updatePayment = async (id, paymentData) => {
  const { data } = await api.put(`/finance/payments/${id}`, paymentData);
  return data;
};

// Delete payment
export const deletePayment = async (id) => {
  const { data } = await api.delete(`/finance/payments/${id}`);
  return data;
};

// Get revenue reports
export const getRevenueReport = async (period = "month") => {
  const { data } = await api.get(`/finance/reports/revenue?period=${period}`);
  return data;
};

// M-Pesa STK Push
export const initiateMpesaSTK = async (phoneNumber, amount, invoiceNumber) => {
  const { data } = await api.post("/finance/mpesa/stk", {
    phoneNumber,
    amount,
    invoiceNumber,
  });
  return data;
};

// Query M-Pesa STK Status
export const queryMpesaSTKStatus = async (checkoutRequestID) => {
  const { data } = await api.post("/finance/mpesa/query", {
    checkoutRequestID,
  });
  return data;
};


