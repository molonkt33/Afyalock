import mongoose from "mongoose";

const emergencySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    age: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    condition: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    triageNurse: {
      type: String,
    },
    arrivalTime: {
      type: Date,
      default: Date.now,
    },
    admittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Stable", "Discharged", "Transferred"],
      default: "Pending",
      index: true,
    },
    phone: {
      type: String,
    },
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    fileUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("EmergencyCase", emergencySchema);
