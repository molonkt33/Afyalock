import mongoose from "mongoose";

const outPatientSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
    },
    assignedDoctor: {
      type: String,
    },
    visitDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    diagnosis: String,
    prescription: String,
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("OutPatient", outPatientSchema);
