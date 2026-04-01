import mongoose from "mongoose";

const labReportSchema = new mongoose.Schema(
  {
    patient: {
      type: String,
      required: true,
    },
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Completed"],
      default: "Pending",
    },
    result: String,
    notes: String,
    fileUrl: String,

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

labReportSchema.index({ patient: 1, createdAt: -1 });

export default mongoose.model("LabReport", labReportSchema);
