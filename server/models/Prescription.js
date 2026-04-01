import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  instructions: {
    type: String,
    default: ""
  }
});

const prescriptionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },
  medications: [medicationSchema],
  notes: {
    type: String,
    default: ""
  },
  prescribedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  datePrescribed: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["Active", "Dispensed", "Completed", "Cancelled"],
    default: "Active"
  },
  pharmacyStatus: {
    type: String,
    enum: ["Pending", "Dispensed", "Out of Stock"],
    default: "Pending"
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Virtual for patient full name (populate helper)
prescriptionSchema.virtual('patientFullName', {
  ref: 'Patient',
  localField: 'patient',
  foreignField: '_id',
  justOne: true
});

prescriptionSchema.set('toJSON', { virtuals: true });
prescriptionSchema.set('toObject', { virtuals: true });

export default mongoose.model("Prescription", prescriptionSchema);

