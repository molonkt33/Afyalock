// routes/messageRoutes.js
import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  getChatUsers,
} from "../controllers/messageController.js";

const router = express.Router();

// GET all messages (all authenticated users)
router.get("/", protect, getMessages);

// GET all users for chat sidebar (all authenticated users)
router.get("/users", protect, getChatUsers);

// POST new message (all authenticated users)
router.post("/", protect, sendMessage);

// PATCH edit message (sender or admin)
router.patch("/:id", protect, editMessage);

// DELETE message (admin only)
router.delete("/:id", protect, authorizeRoles("admin"), deleteMessage);

export default router;

