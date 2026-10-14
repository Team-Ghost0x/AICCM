/**
 * Module 1: Authentication & User Management
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 * PATCH /api/auth/role
 */
import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { signToken, requireAuth } from "../auth.js";

export const router = Router();

// ── Helper: public user shape ────────────────────────────────────────────────
function publicUser(user) {
  const creator = user.role === "creator"
    ? db.creators.find((c) => c.displayName === user.name || c.displayName === user.company || c.handle === (user.company || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"))
    : null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    company: user.company,
    role: user.role,
    balanceInr: user.balanceInr,
    credits: user.credits,
    creatorHandle: creator ? creator.handle : undefined,
  };
}

// ── 1.1 POST /api/auth/register ──────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, company, role } = req.body;

    // Validation
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        error: "Missing required fields: email, password, name, role",
        code: "VALIDATION_ERROR",
      });
    }

    const validRoles = ["brand", "creator"];
    if (role === "admin") {
      return res.status(403).json({
        error: "Administrator accounts cannot be registered publicly. They must be provisioned securely.",
        code: "FORBIDDEN",
      });
    }
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        code: "VALIDATION_ERROR",
      });
    }

    // Check for duplicate email
    if (db.findUserByEmail(email)) {
      return res.status(409).json({
        error: "An account with this email already exists",
        code: "EMAIL_CONFLICT",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = {
      id: `usr_${uuidv4().slice(0, 8)}`,
      email: email.toLowerCase(),
      passwordHash,
      name,
      company: company || null,
      role,
      balanceInr: role === "brand" ? 250000 : 50000,
      credits: 250,
      createdAt: new Date().toISOString(),
    };

    await db.addUser(newUser);

    if (role === "creator") {
      const baseHandle = (company || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      let handle = baseHandle || `creator-${newUser.id.slice(4)}`;
      if (db.findCreatorByHandle(handle)) {
        handle = `${handle}-${Date.now().toString(36).slice(-4)}`;
      }
      const newCreator = {
        id: `cr_${uuidv4().slice(0, 8)}`,
        handle,
        displayName: name,
        headline: company ? `${company} · AI Generative Director` : "Generative AI Creator & Visual Artist",
        bio: `Specialized in cinematic camera control, consistent identity synthesis, and cutting-edge diffusion pipelines.`,
        location: "India",
        avatarUrl: null,
        specializations: ["ai_film", "product_ads"],
        skills: ["Prompt design", "LoRA training", "ComfyUI VFX", "Camera control"],
        tools: [
          { toolId: "comfyui", name: "ComfyUI", kind: "video", usedFor: "Custom LoRA motion chaining", verify: "reviewed" },
          { toolId: "runway-gen3", name: "Runway Gen-3", kind: "video", usedFor: "Cinematic motion generation", verify: "reviewed" },
          { toolId: "midjourney", name: "Midjourney v6", kind: "image", usedFor: "Concept art and storyboarding", verify: "evidence_attached" },
        ],
        contentTypes: ["video", "still"],
        formats: ["9:16", "16:9"],
        turnaroundDays: 4,
        priceFromInr: 25000,
        availability: "open",
        verification: { tools: "reviewed", workflow: "evidence_attached", pastWork: "reviewed" },
        portfolio: [],
        isSample: false,
        createdAt: new Date().toISOString(),
      };
      await db.addCreator(newCreator);
    }

    db.addAuditLog("AUTH", newUser.id, `New ${role} account registered: ${email}`);

    const token = signToken({ userId: newUser.id, email: newUser.email, role: newUser.role });

    return res.status(201).json({
      user: publicUser(newUser),
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Registration failed", code: "INTERNAL_ERROR" });
  }
});

// ── 1.2 POST /api/auth/login ─────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password, provider, idToken, role } = req.body;

    if (provider === "google" && idToken) {
      // Google OAuth: in this implementation we validate the idToken structure
      // In production this would verify against Google's public keys
      return res.status(400).json({
        error: "Google OAuth not configured in this environment. Use email/password.",
        code: "OAUTH_NOT_CONFIGURED",
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        error: "Missing required fields: email, password",
        code: "VALIDATION_ERROR",
      });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
    }

    // If role requested, update current role
    if (role && ["brand", "creator", "admin"].includes(role)) {
      user.role = role;
    }

    db.addAuditLog("AUTH", user.id, `User ${email} authenticated via email`);

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return res.status(200).json({
      user: publicUser(user),
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed", code: "INTERNAL_ERROR" });
  }
});

// ── 1.3 POST /api/auth/logout ────────────────────────────────────────────────
router.post("/logout", requireAuth, (req, res) => {
  db.revokedTokens.add(req.token);
  db.addAuditLog("AUTH", req.user.userId, `User ${req.user.email} logged out`);
  return res.status(200).json({
    success: true,
    message: "Session successfully invalidated",
  });
});

// ── 1.4 GET /api/auth/me ─────────────────────────────────────────────────────
router.get("/me", requireAuth, (req, res) => {
  const user = db.findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found", code: "USER_NOT_FOUND" });
  }
  return res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
    company: user.company,
    role: user.role,
    balanceInr: user.balanceInr,
    credits: user.credits,
  });
});

// ── 1.5 PATCH /api/auth/role ─────────────────────────────────────────────────
router.patch("/role", requireAuth, (req, res) => {
  const { role } = req.body;
  const validRoles = ["brand", "creator", "admin"];

  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({
      error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      code: "VALIDATION_ERROR",
    });
  }

  const user = db.findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found", code: "USER_NOT_FOUND" });
  }

  user.role = role;
  const updatedAt = new Date().toISOString();
  db.addAuditLog("AUTH", user.id, `User ${user.email} switched role to ${role}`);
  if (typeof db.save === "function") db.save();

  return res.status(200).json({
    id: user.id,
    role: user.role,
    updatedAt,
  });
});
