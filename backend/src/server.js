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

// Strip tech fingerprint
app.disable("x-powered-by");

// CORS configuration
const parseCorsOrigins = (val) => {
  if (!val || val === "*") return "*";
  return val.split(",").map((s) => s.trim());
};

const allowedOriginPatterns = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/103\.106\.229\.38(:\d+)?$/,
  /^https?:\/\/([a-z0-9-]+\.)?ayushsrivastav\.in(:\d+)?$/,
];

// Security headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Basic IP rate limiting on authentication routes
const loginAttempts = new Map();
const authRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "client-ip";
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAttempts = 20;

  const record = loginAttempts.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }
  loginAttempts.set(ip, record);

  if (record.count > maxAttempts) {
    return res.status(429).json({
      error: "Too many requests. Please slow down and try again shortly.",
      code: "RATE_LIMITED",
    });
  }
  next();
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const origins = parseCorsOrigins(process.env.CORS_ORIGIN);
    if (origins === "*" || origins.includes(origin)) {
      return callback(null, true);
    }
    if (allowedOriginPatterns.some((pattern) => pattern.test(origin))) {
      return callback(null, true);
    }
    // Allow development and preview environments
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "1mb" }));

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API route mounts
app.use("/api/auth", authRateLimiter, authRouter);
app.use("/api/creators", creatorsRouter);
app.use("/api/briefs", briefsRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/threads", threadsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/tracker", trackerRouter);
app.use("/api/rights", rightsRouter);
app.use("/api/admin", adminRouter);

// Service health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() });
});

// 404 handler for API routes
app.all("/api/*", (_req, res) => {
  res.status(404).json({ error: "Route not found", code: "NOT_FOUND" });
});

// Root landing redirect to frontend
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

// Catch-all route
app.all("*", (_req, res) => {
  res.status(404).json({
    error: "Retake Backend REST API Server. Please connect via frontend.",
    code: "NOT_FOUND",
  });
});

// Global error handler
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
