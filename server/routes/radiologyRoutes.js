import express from "express";
import RadiologyReport from "../models/RadiologyReport.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// GET all radiology reports (for dashboard view)
router.get("/", protect, async (req, res, next) => {
  try {
    const reports = await RadiologyReport.find({
      deletedAt: null,
    }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// POST create new radiology report or upload file
router.post(
  "/",
  protect,
  authorizeRoles("radiology", "doctor", "admin"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { fullName, scanType, priority, status, scheduledDate, notes, radiologist } = req.body;

      const report = await RadiologyReport.create({
        fullName,
        scanType,
        priority: priority || "Routine",
        status: status || "Pending",
        scheduledDate,
        notes,
        radiologist,
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

router.get("/:patientId", protect, async (req, res) => {
  const reports = await RadiologyReport.find({
    patient: req.params.patientId,
    deletedAt: null,
  });
  res.json(reports);
});

export default router;
