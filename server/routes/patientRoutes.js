import express from "express";
import Patient from "../models/Patient.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { advancedQuery } from "../middleware/advancedQuery.js";

const router = express.Router();

/**
 * @route   POST /api/patients
 * @desc    Create patient
 * @access  Authenticated users
 */
// Only reception, nurse and admin may create patient records
router.post("/", protect, authorizeRoles("reception", "nurse", "admin"), async (req, res, next) => {
  try {
    const patient = await Patient.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/patients/history
 * @desc    Get discharged/historical patients
 * @access  Authenticated users
 */
router.get("/active", protect, async (req, res, next) => {
  try {
    const patients = await Patient.find({
      deletedAt: null,
      dischargeDate: null, // still admitted
    }).sort({ createdAt: -1 });

    res.json(patients);
  } catch (error) {
    next(error);
  }
});

router.get("/history", protect, async (req, res, next) => {
  try {
    const patients = await Patient.find({
      $or: [
        { deletedAt: { $ne: null } },
        { dischargeDate: { $ne: null } },
      ],
    }).sort({ deletedAt: -1, dischargeDate: -1 });

    res.json(patients);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/patients
 * @desc    Get all patients (Pagination + Search + Filter)
 * @access  Authenticated users
 *
 * Example:
 * /api/patients?page=1&limit=10
 * /api/patients?fullName=John
 * /api/patients?sort=createdAt
 */
router.get(
  "/",
  protect,
  advancedQuery(Patient, { deletedAt: null }), // 👈 ensures soft-deleted excluded
  (req, res) => {
    res.status(200).json(res.advancedResults);
  }
);

/**
 * @route   GET /api/patients/:id
 * @desc    Get single patient
 * @access  Authenticated users
 */
router.get("/:id", protect, async (req, res, next) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/patients/:id
 * @desc    Soft delete patient
 * @access  Admin only
 */
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  async (req, res, next) => {
    try {
      const patient = await Patient.findByIdAndUpdate(
        req.params.id,
        { deletedAt: new Date(), isActive: false },
        { new: true }
      );

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      res.json({
        success: true,
        message: "Patient soft deleted",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;