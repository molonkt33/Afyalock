import asyncHandler from "express-async-handler";
import User from "../models/User.js";

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) throw new Error("User not found");
  res.json(user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new Error("User not found");

  user.fullName = req.body.fullName || user.fullName;
  user.role = req.body.role || user.role;

  const updated = await user.save();
  res.json(updated);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new Error("User not found");

  await user.deleteOne();
  res.json({ message: "User removed" });
});