import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import path from "path";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import patientRoutes from "./routes/patient.routes";
import appointmentRoutes from "./routes/appointment.routes";
import visitRoutes from "./routes/visit.routes";
import medicineRoutes from "./routes/medicine.routes";
import prescriptionRoutes from "./routes/prescription.routes";
import billRoutes from "./routes/bill.routes";
import reportsRoutes from "./routes/reports.routes";
import mobileUploadRoutes from "./routes/mobileUpload.routes";
import networkRoutes from "./routes/network.routes";
import { initializeDatabase } from "./utils/bootstrap";

const app = express();

// Start DB initialization eagerly at module load.
// The middleware below will block requests until it completes.
const initPromise = initializeDatabase();

// Handling Cors — reflect allowed origins (fixes split ngrok frontend/backend tunnels)
const isAllowedOrigin = (origin: string): boolean => {
  if (
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:") ||
    origin.startsWith("http://192.168.") ||
    origin.startsWith("http://10.")
  ) {
    return true;
  }
  if (/^https:\/\/.*\.ngrok-free\.(app|dev)$/.test(origin)) return true;
  if (/^https:\/\/.*\.ngrok\.(app|io)$/.test(origin)) return true;
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, "");
  if (frontendUrl && origin === frontendUrl) return true;
  return process.env.NODE_ENV !== "production";
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, origin || true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Cookie",
      "Set-Cookie",
      "ngrok-skip-browser-warning",
    ],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400,
  })
);

// Block requests until DB initialization is complete
app.use((req: Request, res: Response, next: NextFunction) => {
  initPromise.then(() => next()).catch(next);
});

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Local clinical photos — served from cmsServer/uploads (sibling of src/)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Registering the routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/patients", patientRoutes);
app.use("/api/v1/appointments", appointmentRoutes);
app.use("/api/v1/visits", visitRoutes);
app.use("/api/v1/medicines", medicineRoutes);
app.use("/api/v1/prescriptions", prescriptionRoutes);
app.use("/api/v1/bills", billRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/network", networkRoutes);
// Public mobile upload API (also under /api/v1/m for axios base URL)
app.use("/m", mobileUploadRoutes);
app.use("/api/v1/m", mobileUploadRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("<h1>Clinic Management System API</h1>");
});

export default app;
