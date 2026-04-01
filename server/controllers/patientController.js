import asyncHandler from "express-async-handler";
import Patient from "../models/Patient.js";

export const createPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.create({
    ...req.body,
    createdBy: req.user.id,
  });

  res.status(201).json(patient);
});

export const getPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find();
  res.json(patients);
});

export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw new Error("Patient not found");
  res.json(patient);
});

export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw new Error("Patient not found");

  Object.assign(patient, req.body);
  const updated = await patient.save();

  res.json(updated);
});

export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw new Error("Patient not found");

  await patient.deleteOne();
  res.json({ message: "Patient removed" });
});