import express from "express";
import { createCalendarEvent } from "../utils/googleCalendar.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only reception, admins and doctors can create calendar events/appointments
router.post("/create-event", protect, authorizeRoles("reception", "admin", "doctor"), async (req, res) => {
  const event = await createCalendarEvent(req.body);
  res.json(event);
});

export default router;