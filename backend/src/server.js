import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { router as authRouter } from "./routes/auth.js";
import { router as creatorsRouter } from "./routes/creators.js";
import { router as briefsRouter } from "./routes/briefs.js";
import { router as requestsRouter } from "./routes/requests.js";
import { router as threadsRouter } from "./routes/threads.js";
import { router as paymentsRouter } from "./routes/payments.js";
import { router as trackerRouter } from "./routes/tracker.js";
import { router as rightsRouter } from "./routes/rights.js";
import { router as adminRouter } from "./routes/admin.js";
import { db } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
const parseCorsOrigins = (val) => {
  if (!val || val === "*") return "*";
  const origins = val.split(",").map((s) => s.trim());
  if (!origins.includes("http://localhost:3000")) origins.push("http://localhost:3000");
  if (!origins.includes("http://localhost:3002")) origins.push("http://localhost:3002");
  return origins;
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const origins = parseCorsOrigins(process.env.CORS_ORIGIN);
    if (origins === "*" || origins.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/creators", creatorsRouter);
app.use("/api/briefs", briefsRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/threads", threadsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/tracker", trackerRouter);
app.use("/api/rights", rightsRouter);
app.use("/api/admin", adminRouter);

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() });
});

// ── API 404 Handler ──────────────────────────────────────────────────────────
app.all("/api/*", (_req, res) => {
  res.status(404).json({ error: "Route not found", code: "NOT_FOUND" });
});

// ── Root Route ───────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  if (req.accepts("html")) {
    return res.redirect("http://localhost:3002");
  }
  res.json({
    message: "Retake Backend REST API Server",
    frontend: "http://localhost:3002",
    health: "/api/health",
  });
});

// ── Fallback 404 for any other non-API routes ────────────────────────────────
app.all("*", (_req, res) => {
  res.status(404).json({
    error: "Retake Backend REST API Server. Please connect via frontend.",
    code: "NOT_FOUND",
  });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
});

// Initialize MySQL and start listening
db.initMySQL().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Retake Backend REST API running at http://localhost:${PORT}`);
    console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
    console.log(`📋 35 endpoints across 8 functional modules active with MySQL storage`);
  });
}).catch((err) => {
  console.error("Failed to initialize database:", err);
  app.listen(PORT, () => {
    console.log(`🚀 Retake Backend running in fallback mode at http://localhost:${PORT}`);
  });
});
