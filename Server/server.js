import "./env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import patientAuthRoutes from "./routes/patientAuthRoutes.js";
import patientPortalRoutes from "./routes/patientPortalRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import patientAdminRoutes from "./routes/patientAdminRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import revenueRoutes from "./routes/revenueRoutes.js";

const app = express();

// Connect to MongoDB
connectDB();

// Basic security & parsing middleware
app.use(helmet());
app.use(
  cors({
    // In dev, the frontend might run on `localhost:5173` while some setups (e.g. docker)
    // set `CLIENT_ORIGIN` to `localhost:3000`. If CORS doesn't match, axios errors
    // won't expose `response.data.message` and the UI falls back to a generic message.
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header)
      if (!origin) return callback(null, true);

      const envOrigin = process.env.CLIENT_ORIGIN;
      const allowedOrigins = [
        envOrigin,
        "http://localhost:5173",
        "http://localhost:3000",
      ]
        .filter(Boolean)
        .map((o) => String(o).trim());

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Rate limiting for auth and general API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", apiLimiter);

// Health check
app.get("/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/patient/auth", patientAuthRoutes);
app.use("/api/patient", patientPortalRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/patients", patientAdminRoutes);
app.use("/api/admin/revenue", revenueRoutes);
app.use("/api/departments", departmentRoutes);

// 404 + error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
