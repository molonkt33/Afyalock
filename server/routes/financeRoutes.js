import express from "express";
import {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getRevenueReport
} from "../controllers/financeController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/finance/payments
 * @desc    Get all payments
 * @access  Private (reception, admin)
 */
router.get("/payments", protect, authorizeRoles("reception", "admin"), getPayments);

/**
 * @route   GET /api/finance/payments/:id
 * @desc    Get single payment
 * @access  Private (reception, admin)
 */
router.get("/payments/:id", protect, authorizeRoles("reception", "admin"), getPaymentById);

/**
 * @route   POST /api/finance/payments
 * @desc    Create payment
 * @access  Private (reception, admin)
 */
router.post("/payments", protect, authorizeRoles("reception", "admin"), createPayment);

/**
 * @route   PUT /api/finance/payments/:id
 * @desc    Update payment status
 * @access  Private (creator, admin)
 */
router.put("/payments/:id", protect, authorizeRoles("reception", "admin"), updatePayment);

/**
 * @route   DELETE /api/finance/payments/:id
 * @desc    Soft delete payment
 * @access  Private (creator, admin)
 */
router.delete("/payments/:id", protect, authorizeRoles("reception", "admin"), deletePayment);

/**
 * @route   GET /api/finance/reports/revenue
 * @desc    Revenue reports by period
 * @access  Private (admin)
 * @query   ?period=day|week|month
 */
router.get("/reports/revenue", protect, authorizeRoles("admin"), getRevenueReport);

export default router;

