import jwt from "jsonwebtoken";
import { db } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "retake-platform-super-secret-key-2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Signs a JWT token for a given user payload.
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * Throws an error if the token is invalid or expired.
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Express middleware: requires a valid Bearer token.
 * Attaches `req.user` (decoded JWT payload) if valid.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authorization header missing or malformed",
      code: "UNAUTHORIZED",
    });
  }

  const token = authHeader.slice(7);

  // Check if token has been revoked (logout)
  if (db.revokedTokens.has(token)) {
    return res.status(401).json({ error: "Token has been revoked", code: "TOKEN_REVOKED" });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    req.token = token;
    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
      code: "TOKEN_INVALID",
    });
  }
}

/**
 * Express middleware: optional Bearer token check.
 * Attaches req.user if a valid token is provided, but does not reject if missing.
 */
export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.slice(7);
  if (db.revokedTokens && db.revokedTokens.has(token)) {
    return next();
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    req.token = token;
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}

/**
 * Middleware factory: restricts access to specific roles.
 * Must be used after requireAuth.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access forbidden. Required role(s): ${roles.join(", ")}`,
        code: "FORBIDDEN",
      });
    }
    next();
  };
}
