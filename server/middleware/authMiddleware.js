// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

// ================= PROTECT ROUTES =================
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password -refreshToken");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      // 🔥 Attach audit logging after response finishes
      res.on("finish", async () => {
        try {
          await AuditLog.create({
            user: req.user._id,
            action: `${req.method} ${req.originalUrl}`,
            status: res.statusCode,
            ipAddress: req.ip,
          });
        } catch (err) {
          console.error("Audit log failed:", err.message);
        }
      });

      next();
    } catch {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// ================= ROLE-BASED AUTHORIZATION =================
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: You do not have permission" });
    }

    next();
  };
};