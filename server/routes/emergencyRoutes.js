import express from "express";
import EmergencyCase from "../models/EmergencyCase.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Emergency creation is limited to emergency staff, nurses, doctors and admins
router.post(
  "/",
  protect,
  authorizeRoles("emergency", "nurse", "doctor", "admin"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      const emergency = await EmergencyCase.create({ 
        ...req.body, 
        createdBy: req.user?._id,
        fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
      });
      res.status(201).json({
        success: true,
        data: emergency,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/", protect, async (req, res) => {
  const cases = await EmergencyCase.find();
  res.json(cases);
});

export default router;
