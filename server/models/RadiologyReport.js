import mongoose from "mongoose";

const radiologySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    scanType: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["Routine", "Urgent"],
      default: "Routine",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "In Review"],
      default: "Pending",
    },
    scheduledDate: {
      type: Date,
    },
    radiologist: {
      type: String,
    },
    findings: String,
    notes: String,
    fileUrl: String,
    imageUrl: String,

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

radiologySchema.index({ fullName: 1, createdAt: -1 });

export default mongoose.model("RadiologyReport", radiologySchema);
