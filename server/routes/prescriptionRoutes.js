import express from "express";
import {
  getPrescriptions,
  getPrescriptionsByPatient,
  createPrescription,
  updatePrescription,
  deletePrescription
} from "../controllers/prescriptionController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/prescriptions
 * @desc    Get all prescriptions
 * @access  Private (all staff roles)
 */
router.get("/", protect, getPrescriptions);

/**
 * @route   GET /api/prescriptions/patient/:patientId
 * @desc    Get prescriptions for specific patient
 * @access  Private
 */
router.get("/patient/:patientId", protect, getPrescriptionsByPatient);

/**
 * @route   POST /api/prescriptions
 * @desc    Create new prescription
 * @access  Private (reception, nurse, doctor, admin)
 */
router.post(
  "/",
  protect,
  authorizeRoles("reception", "nurse", "doctor", "admin"),
  createPrescription
);

/**
 * @route   PUT /api/prescriptions/:id
 * @desc    Update prescription
 * @access  Private (creator, doctor, admin)
 */
router.put("/:id", protect, updatePrescription);

/**
 * @route   DELETE /api/prescriptions/:id
 * @desc    Soft delete prescription
 * @access  Private (creator, admin)
 */
router.delete("/:id", protect, deletePrescription);

export default router;

