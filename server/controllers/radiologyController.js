import asyncHandler from "express-async-handler";
import RadiologyReport from "../models/RadiologyReport.js";

export const createRadiologyReport = asyncHandler(async (req, res) => {
  const report = await RadiologyReport.create({
    ...req.body,
    image: req.file?.path,
    createdBy: req.user.id,
  });

  res.status(201).json(report);
});

export const getRadiologyReports = asyncHandler(async (req, res) => {
  const reports = await RadiologyReport.find();
  res.json(reports);
});