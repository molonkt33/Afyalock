import express from "express";
import LabReport from "../models/LabReport.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/labs
 * @desc    Get all lab reports with pagination
 * @access  Authenticated users
 */
router.get("/", protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const reports = await LabReport.find({
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LabReport.countDocuments({ deletedAt: null });

    res.json({
      success: true,
      count: reports.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: reports,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/labs
 * @desc    Create lab report with optional file upload
 * @access  Lab, Doctor, Admin
 */
router.post(
  "/",
  protect,
  authorizeRoles("lab", "doctor", "admin"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { patient, testName, result, notes } = req.body;

      if (!patient || !testName) {
        return res.status(400).json({
          success: false,
          message: "Patient and test name are required",
        });
      }

      const report = await LabReport.create({
        patient,
        testName,
        result,
        notes,
        fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
        createdBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/labs/:patientId
 * @desc    Get lab reports for patient
 * @access  Authenticated users
 */
router.get("/:patientId", protect, async (req, res, next) => {
  try {
    const reports = await LabReport.find({
      patient: req.params.patientId,
      deletedAt: null,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
});

export default router;