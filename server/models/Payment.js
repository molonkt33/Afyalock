import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  // Payment Info
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: "KES"
  },
  paymentMethod: {
    type: String,
    enum: ["mpesa", "cash", "card", "paypal", "bank_transfer"],
    required: true
  },
  paymentReference: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },

  // Links
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prescription"
  },
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },

  // M-Pesa specific
  mpesaPhone: String,
  checkoutRequestId: String,
  resultCode: String,

  // Audit
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  notes: String,

  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Virtuals
paymentSchema.virtual("patientFullName", {
  ref: "Patient",
  localField: "patient",
  foreignField: "_id",
  justOne: true
});

paymentSchema.virtual("prescriptionTotal", {
  ref: "Prescription",
  localField: "prescription",
  foreignField: "_id",
  justOne: true
});

paymentSchema.set("toJSON", { virtuals: true });
paymentSchema.set("toObject", { virtuals: true });

export default mongoose.model("Payment", paymentSchema);

