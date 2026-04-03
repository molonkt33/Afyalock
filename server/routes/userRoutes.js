// routes/userRoutes.js
import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import { getUsers } from "../controllers/userController.js";
import { deleteUser } from "../controllers/userController.js";

const router = express.Router();

// GET all users (admin only)
router.get("/", protect, authorizeRoles("admin"), async (req, res) => {
  const users = await User.find({ deletedAt: null });
  res.json(users);
});

// CREATE new user (admin only)
router.post("/", protect, authorizeRoles("admin"), async (req, res) => {
  const { fullName, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = await User.create({
    fullName,
    email,
    password,
    role,
  });

  res.status(201).json({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  });
});

// UPDATE user (admin only)
router.put("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  const { fullName, email, role } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.fullName = fullName || user.fullName;
  user.email = email || user.email;
  user.role = role || user.role;

  await user.save();

  res.json({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  });
});

// RESET password (admin only)
router.put("/:id/reset-password", protect, authorizeRoles("admin"), async (req, res) => {
  const { newPassword } = req.body;

  const user = await User.findById(req.params.id).select("+password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: "Password reset successfully" });
});

// DEACTIVATE a user (admin only)
router.put("/:id/deactivate", protect, authorizeRoles("admin"), async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.isActive = false;
  await user.save();

  res.json({ message: "User deactivated" });
});

// ACTIVATE a user (admin only)
router.put("/:id/activate", protect, authorizeRoles("admin"), async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.isActive = true;
  await user.save();

  res.json({ message: "User activated" });
});

// CHANGE password (for logged in user to change their own password)
router.put("/change-password", protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId).select("+password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  user.password = newPassword;
  
  // Add activity log entry
  user.activityLog = user.activityLog || [];
  user.activityLog.unshift({
    action: 'PASSWORD_CHANGE',
    description: 'User changed their password',
    performedAt: new Date(),
    ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
  });
  
  // Keep only last 50 activity records
  if (user.activityLog.length > 50) {
    user.activityLog = user.activityLog.slice(0, 50);
  }
  
  await user.save();

  res.json({ message: "Password changed successfully" });
});

// UPDATE profile picture (for logged in user)
router.put("/profile-picture", protect, async (req, res) => {
  const { profilePicture } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.profilePicture = profilePicture;
  
  // Add activity log entry
  user.activityLog = user.activityLog || [];
  user.activityLog.unshift({
    action: 'PROFILE_PICTURE_UPDATE',
    description: 'User updated profile picture',
    performedAt: new Date(),
    ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
  });
  
  // Keep only last 50 activity records
  if (user.activityLog.length > 50) {
    user.activityLog = user.activityLog.slice(0, 50);
  }
  
  await user.save();

  res.json({ 
    message: "Profile picture updated successfully",
    profilePicture: user.profilePicture 
  });
});

// GET current user profile with activity data
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
});

// DELETE user (admin only) - PERMANENT DELETE
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);

// LOG custom activity (for various user actions)
router.post("/activity", protect, async (req, res) => {
  const { action, description, metadata } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Add activity log entry
  user.activityLog = user.activityLog || [];
  user.activityLog.unshift({
    action: action || 'CUSTOM_ACTION',
    description: description || 'User performed an action',
    performedAt: new Date(),
    ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    metadata: metadata || {},
  });
  
  // Keep only last 50 activity records
  if (user.activityLog.length > 50) {
    user.activityLog = user.activityLog.slice(0, 50);
  }
  
  await user.save();

  res.json({ message: "Activity logged successfully" });
});

export default router;
