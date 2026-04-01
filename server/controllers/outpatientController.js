import asyncHandler from "express-async-handler";
import OutPatient from "../models/OutPatient.js";

export const createOutPatient = asyncHandler(async (req, res) => {
  const outpatient = await OutPatient.create({
    ...req.body,
    doctor: req.user.id,
  });

  res.status(201).json(outpatient);
});

export const getOutPatients = asyncHandler(async (req, res) => {
  const outpatients = await OutPatient.find();
  res.json(outpatients);
});