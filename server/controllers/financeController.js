import Payment from "../models/Payment.js";
import asyncHandler from "express-async-handler";
import { initiateMpesaSTK, queryMpesaSTKStatus } from "../utils/mpesa.js";

// @desc    Get all payments
// @route   GET /api/finance/payments
// @access  Private (reception, admin)
const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ deletedAt: null })
    .populate("patient", "firstName lastName fullName phone")
    .populate("prescription")
    .populate("processedBy", "fullName role")
    .sort({ createdAt: -1 });

  // Calculate totals
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status === "pending").length;
  const paidPayments = payments.filter(p => p.status === "paid").length;

  res.json({
    success: true,
    count: payments.length,
    data: payments,
    stats: {
      totalRevenue,
      pending: pendingPayments,
      paid: paidPayments
    }
  });
});

// @desc    Get payment by ID
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate("patient")
    .populate("prescription")
    .populate("processedBy");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  res.json({
    success: true,
    data: payment
  });
});

// @desc    Create payment
const createPayment = asyncHandler(async (req, res) => {
  const {
    amount,
    paymentMethod,
    patient,
    prescription,
    invoiceNumber,
    mpesaPhone,
    notes
  } = req.body;

  if (!amount || !paymentMethod || !patient || !invoiceNumber) {
    res.status(400);
    throw new Error("Amount, method, patient and invoice required");
  }

  const paymentRef = `INV-${invoiceNumber}-${Date.now()}`;

  const payment = await Payment.create({
    ...req.body,
    paymentReference: paymentRef,
    processedBy: req.user._id,
    status: "pending" // Default until processed
  });

  const populated = await Payment.findById(payment._id)
    .populate("patient")
    .populate("prescription")
    .populate("processedBy");

  res.status(201).json({
    success: true,
    data: populated
  });
});

// @desc    Update payment status
const updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  if (payment.processedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized");
  }

  const updated = await Payment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate("patient", "fullName")
   .populate("prescription")
   .populate("processedBy");

  res.json({
    success: true,
    data: updated
  });
});

// @desc    Delete payment (soft)
const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  if (payment.processedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized");
  }

  payment.deletedAt = new Date();
  await payment.save();

  res.json({
    success: true,
    message: "Payment deleted"
  });
});

// @desc    Get revenue reports
const getRevenueReport = asyncHandler(async (req, res) => {
  const { period = "month" } = req.query;

  const match = { deletedAt: null };
  if (period === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    match.createdAt = { $gte: weekAgo };
  } else if (period === "today") {
    match.createdAt = {
      $gte: new Date(new Date().setHours(0,0,0,0)),
      $lte: new Date(new Date().setHours(23,59,59,999))
    };
  }

  const payments = await Payment.find(match)
    .populate("patient", "fullName")
    .populate("prescription")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: payments,
    summary: {
      total: payments.reduce((sum, p) => sum + p.amount, 0),
      count: payments.length
    }
  });
});

// @desc    Initiate M-Pesa STK Push
// @route   POST /api/finance/mpesa/stk
// @access  Private (reception, admin)
const initiateStkPush = asyncHandler(async (req, res) => {
  const { phoneNumber, amount, invoiceNumber } = req.body;

  if (!phoneNumber || !amount || !invoiceNumber) {
    res.status(400);
    throw new Error("Phone number, amount, and invoice number required");
  }

  try {
    const response = await initiateMpesaSTK(phoneNumber, amount, invoiceNumber);
    
    res.status(200).json({
      success: true,
      message: "STK push initiated successfully",
      data: {
        checkoutRequestID: response.checkoutRequestID,
        responseCode: response.responseCode,
        responseDescription: response.responseDescription,
        customerMessage: response.customerMessage,
      }
    });
  } catch (error) {
    res.status(400);
    throw error;
  }
});

// @desc    Query M-Pesa STK Status
// @route   POST /api/finance/mpesa/query
// @access  Private (reception, admin)
const queryStkStatus = asyncHandler(async (req, res) => {
  const { checkoutRequestID } = req.body;

  if (!checkoutRequestID) {
    res.status(400);
    throw new Error("Checkout request ID required");
  }

  try {
    const response = await queryMpesaSTKStatus(checkoutRequestID);
    
    // Determine if payment was successful
    const isSuccess = response.resultCode === "0";

    res.status(200).json({
      success: true,
      data: {
        isSuccess,
        resultCode: response.resultCode,
        resultDesc: response.resultDesc,
        mpesaReceiptNumber: response.mpesaReceiptNumber,
      }
    });
  } catch (error) {
    res.status(400);
    throw error;
  }
});

export {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getRevenueReport,
  initiateStkPush,
  queryStkStatus
};

