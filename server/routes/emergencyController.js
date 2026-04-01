import asyncHandler from "express-async-handler";
import EmergencyCase from "../models/EmergencyCase.js";

export const createEmergencyCase = asyncHandler(async (req, res) => {
  const emergency = await EmergencyCase.create({
    ...req.body,
    handledBy: req.user.id,
  });

  res.status(201).json(emergency);
});

export const getEmergencyCases = asyncHandler(async (req, res) => {
  const cases = await EmergencyCase.find();
  res.json(cases);
});