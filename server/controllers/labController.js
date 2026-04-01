import asyncHandler from "express-async-handler";
import LabReport from "../models/LabReport.js";

export const createLabReport = asyncHandler(async (req, res) => {
  const report = await LabReport.create({
    ...req.body,
    file: req.file?.path,
    createdBy: req.user.id,
  });

  res.status(201).json(report);
});

export const getLabReports = asyncHandler(async (req, res) => {
  const reports = await LabReport.find();
  res.json(reports);
});

export const getLabReportById = asyncHandler(async (req, res) => {
  const report = await LabReport.findById(req.params.id);
  if (!report) throw new Error("Lab report not found");
  res.json(report);
});