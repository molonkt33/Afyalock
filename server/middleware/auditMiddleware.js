// middleware/auditMiddleware.js

import AuditLog from "../models/AuditLog.js";

// Middleware that logs each incoming request to the AuditLog collection
export const auditLogger = async (req, res, next) => {
  try {
    await AuditLog.create({
      user: req.user?._id,
      action: `${req.method} ${req.originalUrl}`,
      method: req.method,
      route: req.originalUrl,
      ipAddress: req.ip,
    });
  } catch (error) {
    console.error("Audit log failed:", error.message);
  }

  next();
};