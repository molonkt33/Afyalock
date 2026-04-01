import asyncHandler from "express-async-handler";
import Appointment from "../models/Appointment.js";

export const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.create({
    ...req.body,
    createdBy: req.user.id,
  });

  res.status(201).json(appointment);
});

export const getAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find();
  res.json(appointments);
});