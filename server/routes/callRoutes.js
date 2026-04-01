import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { createVoiceCall, createVideoCall } from "../controllers/callController.js";

const router = express.Router();

// Voice call (admin only)
router.post("/voice", protect, authorizeRoles("admin"), createVoiceCall);

// Video call (admin only)
router.post("/video", protect, authorizeRoles("admin"), createVideoCall);

export default router;

