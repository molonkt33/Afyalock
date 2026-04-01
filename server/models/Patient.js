import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    // 🔹 Basic Info
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    nationalId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // 🔹 Address Info
    address: {
      county: String,
      subCounty: String,
      ward: String,
      postalCode: String,
    },

    // 🔹 Medical Info
    diagnosis: {
      type: String,
      default: "",
    },

    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    allergies: [String],
    chronicConditions: [String],
    currentMedications: [String],

    // 🔹 Admission Info
    admissionDate: {
      type: Date,
      default: Date.now,
    },

    dischargeDate: {
      type: Date,
      default: null,
    },

    ward: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    // 🔹 System Relationships
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔹 Account Status
    isActive: {
      type: Boolean,
      default: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 🔎 Virtual full name
patientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// 🔥 Enable virtuals in JSON
patientSchema.set("toJSON", { virtuals: true });
patientSchema.set("toObject", { virtuals: true });

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
