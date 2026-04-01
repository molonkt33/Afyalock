// ================= IMPORTS =================

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import labRoutes from "./routes/labRoutes.js";
import radiologyRoutes from "./routes/radiologyRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import outpatientRoutes from "./routes/outpatientRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import callRoutes from "./routes/callRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { auditLogger } from "./middleware/auditMiddleware.js"; // ✅ AUDIT LOGGER IMPORT

dotenv.config();

// ================= DATABASE =================
connectDB();

const app = express();

// ================= TRUST PROXY =================
// Required if behind Nginx / Heroku / Render
app.set("trust proxy", 1);

// ================= SECURITY =================

// Secure HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Rate limiter (200 requests per 15 mins per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests from this IP. Try again later.",
});
app.use(limiter);

// Enable CORS
// ================= CORS =================
app.use(
  cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
          "http://localhost:5173", // Vite
          "http://localhost:3000", // CRA (optional)
        ];

        // Production: allow only the configured client URL
        if (
          process.env.NODE_ENV === "production" &&
          origin === process.env.CLIENT_URL
        ) {
          return callback(null, true);
        }

        // Allow requests without origin (curl, server-to-server)
        if (!origin) return callback(null, true);

        // Allow explicitly configured dev origins
        if (allowedOrigins.includes(origin)) return callback(null, true);

        // In development, accept any localhost origin (different dev ports)
        if (
          process.env.NODE_ENV !== "production" &&
          /^https?:\/\/localhost(?::\d+)?$/.test(origin)
        ) {
          return callback(null, true);
        }

        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
// Logging (development only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ================= BODY PARSER =================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ================= STATIC FILES =================

// Needed for ES Modules path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= AUDIT LOGGER =================
// 🔐 Logs all API activity (user actions, IP, route, method, etc.)
app.use(auditLogger);  // middleware now handles request directly


// ================= ROUTES =================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/radiology", radiologyRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/outpatients", outpatientRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/finance", financeRoutes);

// ================= HEALTH CHECK =================

app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "AfyaLock API is running...",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date(),
  });
});

// ================= ERROR HANDLING =================

app.use(notFound);
app.use(errorHandler);

// ================= START SERVER =================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
  console.log(`🚀 AfyaLock Server running on port ${PORT}`)
);

// ================= GRACEFUL SHUTDOWN =================

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated.");
  });
});