import express from "express";
import OutPatient from "../models/OutPatient.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Only reception, nurse, doctor and admin may create outpatient visits
router.post(
  "/",
  protect,
  authorizeRoles("reception", "nurse", "doctor", "admin"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      const visit = await OutPatient.create({ 
        ...req.body, 
        createdBy: req.user?._id,
        fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
      });
      res.status(201).json({
        success: true,
        data: visit,
      });
    } catch (error) {
      next(error);
    }
  }
);

// return all outpatients (used by dashboard filter pages)
router.get("/", protect, async (req, res) => {
  const visits = await OutPatient.find({ deletedAt: null }).sort({ createdAt: -1 });
  res.json(visits);
});

router.get("/:patientId", protect, async (req, res) => {
  const visits = await OutPatient.find({
    patient: req.params.patientId,
  });
  res.json(visits);
});

export default router;
