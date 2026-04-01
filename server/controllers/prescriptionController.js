import Prescription from "../models/Prescription.js";
import Patient from "../models/Patient.js";
import asyncHandler from "express-async-handler";

// @desc    Get all prescriptions (with pagination/filter)
// @route   GET /api/prescriptions
// @access  Private (staff only)
const getPrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({ deletedAt: null })
    .populate("patient", "firstName lastName phone")
    .populate("prescribedBy", "fullName role")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: prescriptions.length,
    data: prescriptions
  });
});

// @desc    Get prescriptions by patient
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private
const getPrescriptionsByPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.patientId);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  const prescriptions = await Prescription.find({
    patient: req.params.patientId,
    deletedAt: null
  })
    .populate("prescribedBy", "fullName role")
    .sort({ datePrescribed: -1 });

  res.json({
    success: true,
    data: prescriptions
  });
});

// @desc    Create new prescription
// @route   POST /api/prescriptions
// @access  Private (reception, doctor, nurse)
const createPrescription = asyncHandler(async (req, res) => {
  const { patient, medications, notes } = req.body;

  if (!patient || !medications || medications.length === 0) {
    res.status(400);
    throw new Error("Patient ID and at least one medication required");
  }

  const prescription = await Prescription.create({
    patient,
    medications,
    notes,
    prescribedBy: req.user._id
  });

  const populated = await Prescription.findById(prescription._id)
    .populate("patient", "firstName lastName")
    .populate("prescribedBy", "fullName role");

  res.status(201).json({
    success: true,
    data: populated
  });
});

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private (creator or admin)
const updatePrescription = asyncHandler(async (req, res) => {
  let prescription = await Prescription.findById(req.params.id);
  
  if (!prescription || prescription.deletedAt) {
    res.status(404);
    throw new Error("Prescription not found");
  }

  // Only creator, admin, or doctor can update
  if (prescription.prescribedBy.toString() !== req.user._id.toString() && 
      !["admin", "doctor"].includes(req.user.role)) {
    res.status(403);
    throw new Error("Not authorized to update this prescription");
  }

  prescription = await Prescription.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate("patient", "firstName lastName")
   .populate("prescribedBy", "fullName role");

  res.json({
    success: true,
    data: prescription
  });
});

// @desc    Delete prescription (soft delete)
// @route   DELETE /api/prescriptions/:id
// @access  Private (creator or admin)
const deletePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);
  
  if (!prescription || prescription.deletedAt) {
    res.status(404);
    throw new Error("Prescription not found");
  }

  if (prescription.prescribedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to delete this prescription");
  }

  prescription.deletedAt = new Date();
  await prescription.save();

  res.json({
    success: true,
    message: "Prescription deleted successfully"
  });
});

export {
  getPrescriptions,
  getPrescriptionsByPatient,
  createPrescription,
  updatePrescription,
  deletePrescription
};

