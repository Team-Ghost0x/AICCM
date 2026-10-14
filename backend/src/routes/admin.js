/**
 * Module 8: Platform Administration & Telemetry
 * GET  /api/admin/metrics      – Platform metrics & GMV
 * GET  /api/admin/audit-logs   – Security & escrow audit trail
 * POST /api/admin/data/reset   – Reset to golden seed state
 */
import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

export const router = Router();

// Telemetry & platform metrics
router.get("/metrics", requireAuth, requireRole("admin"), (req, res) => {
  // Total creators
  const totalCreators = db.creators.length;

  // Active briefs (status: open)
  const activeBriefs = db.briefs.filter((b) => b.status === "open").length;

  // Total escrow in system (locked, not yet released)
  const totalEscrowInr = db.transactions
    .filter((t) => t.type === "escrow_lock" && t.status === "completed")
    .reduce((sum, t) => {
      const released = db.transactions.some(
        (rt) => rt.type === "escrow_release" && rt.milestoneId === t.milestoneId
      );
      return released ? sum : sum + t.amountInr;
    }, 0);

  // Total GMV (all escrow locks ever)
  const totalGmvInr = db.transactions
    .filter((t) => t.type === "escrow_lock" && t.status === "completed")
    .reduce((sum, t) => sum + t.amountInr, 0);

  // Takes produced today
  const today = new Date().toISOString().slice(0, 10);
  const takesProducedToday = db.trackers
    .flatMap((t) => t.takes)
    .filter((take) => take.submittedAt && take.submittedAt.startsWith(today)).length;

  // Active channels (threads with messages in last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const activeChannels = db.threads.filter(
    (t) => t.lastMessageAt && t.lastMessageAt > sevenDaysAgo
  ).length;

  // Total users
  const totalUsers = db.users.length;

  // Active certificates
  const totalCertificates = db.rightsCertificates.length;

  // Deposits in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recentDeposits = db.transactions
    .filter((t) => t.type === "deposit" && t.date > thirtyDaysAgo)
    .reduce((sum, t) => sum + t.amountInr, 0);

  return res.status(200).json({
    totalCreators,
    activeBriefs,
    totalEscrowInr,
    totalGmvInr,
    takesProducedToday,
    activeChannels,
    totalUsers,
    totalCertificates,
    recentDepositsInr: recentDeposits,
    platformHealth: "operational",
    timestamp: new Date().toISOString(),
  });
});

// Security audit trail logs
router.get("/audit-logs", requireAuth, requireRole("admin"), (req, res) => {
  const { limit = 50, offset = 0, tag } = req.query;

  let logs = [...db.auditLogs];

  if (tag) {
    const validTags = ["SYSTEM", "COMMS", "ESCROW", "AUTH"];
    if (!validTags.includes(tag.toUpperCase())) {
      return res.status(400).json({
        error: `Invalid tag. Must be one of: ${validTags.join(", ")}`,
        code: "VALIDATION_ERROR",
      });
    }
    logs = logs.filter((l) => l.tag === tag.toUpperCase());
  }

  // Sort descending by timestamp
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const total = logs.length;
  const paginated = logs.slice(Number(offset), Number(offset) + Number(limit));

  return res.status(200).json({ logs: paginated, total });
});

// Reset database to seed state
router.post("/data/reset", requireAuth, requireRole("admin"), (req, res) => {
  // Revoke all current tokens by clearing the revoked set and resetting db
  db.revokedTokens.clear();
  db.reset();

  console.log(`[ADMIN] Database reset to golden seed by ${req.user.userId} at ${new Date().toISOString()}`);

  return res.status(200).json({
    success: true,
    message: "Demo database successfully restored to golden seed state",
    timestamp: new Date().toISOString(),
  });
});

// Manage platform users
router.get("/users", requireAuth, requireRole("admin"), (req, res) => {
  const { q, role, status } = req.query;
  let users = [...db.users];

  if (q) {
    const query = q.toLowerCase();
    users = users.filter((u) => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || (u.company && u.company.toLowerCase().includes(query)));
  }

  if (role) {
    users = users.filter((u) => u.role === role);
  }

  if (status) {
    users = users.filter((u) => (u.status || "active") === status);
  }

  const safeUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    company: u.company,
    role: u.role,
    status: u.status || "active",
    createdAt: u.createdAt,
  }));

  return res.status(200).json({ users: safeUsers, total: safeUsers.length });
});

// Update user account status
router.patch("/users/:id", requireAuth, requireRole("admin"), (req, res) => {
  const user = db.findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
  }

  const { status, role } = req.body;
  if (status) user.status = status;
  if (role && ["brand", "creator", "admin"].includes(role)) user.role = role;

  user.updatedAt = new Date().toISOString();
  db.addAuditLog("SYSTEM", req.user.userId, `User ${user.email} updated (status: ${user.status}, role: ${user.role})`);
  if (typeof db.save === "function") db.save();

  return res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } });
});

// Pending verification requests
router.get("/verifications", requireAuth, requireRole("admin"), (req, res) => {
  const { status } = req.query;
  let list = db.verifications || [];
  if (status) {
    list = list.filter((v) => v.status === status);
  }
  return res.status(200).json({ verifications: list, total: list.length });
});

// Review creator verification submission
router.patch("/verifications/:id", requireAuth, requireRole("admin"), (req, res) => {
  const ver = (db.verifications || []).find((v) => v.id === req.params.id);
  if (!ver) {
    return res.status(404).json({ error: "Verification request not found", code: "NOT_FOUND" });
  }

  const { status, decisionReason } = req.body;
  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid status", code: "VALIDATION_ERROR" });
  }

  ver.status = status;
  ver.decisionReason = decisionReason || (status === "approved" ? "Evidence verified by platform administrator." : "Evidence insufficient.");
  ver.decidedAt = new Date().toISOString();
  ver.decidedBy = req.user.userId;

  // If approved, update creator's profile verification badge
  if (status === "approved") {
    const creator = db.findCreatorById(ver.creatorId);
    if (creator) {
      if (!creator.verification) {
        creator.verification = { tools: "reviewed", workflow: "evidence_attached", pastWork: "reviewed" };
      } else {
        if (ver.category === "tool_evidence") creator.verification.tools = "reviewed";
        if (ver.category === "workflow_evidence") creator.verification.workflow = "evidence_attached";
        if (ver.category === "identity" || ver.category === "client_reference") creator.verification.pastWork = "reviewed";
      }
    }
  }

  db.addAuditLog("SYSTEM", req.user.userId, `Verification request ${ver.id} marked ${status} for ${ver.creatorName}`);
  if (typeof db.save === "function") db.save();

  return res.status(200).json(ver);
});

// Moderation reports
router.get("/reports", requireAuth, requireRole("admin"), (req, res) => {
  const reports = db.reports || [];
  return res.status(200).json({ reports, total: reports.length });
});

// Resolve moderation report
router.patch("/reports/:id", requireAuth, requireRole("admin"), (req, res) => {
  const rep = (db.reports || []).find((r) => r.id === req.params.id);
  if (!rep) {
    return res.status(404).json({ error: "Report not found", code: "NOT_FOUND" });
  }

  const { status, resolutionNotes } = req.body;
  if (status) rep.status = status;
  if (resolutionNotes) rep.resolutionNotes = resolutionNotes;
  rep.resolvedAt = new Date().toISOString();

  if (typeof db.save === "function") db.save();
  return res.status(200).json(rep);
});

// Category list
router.get("/categories", (_req, res) => {
  return res.status(200).json(db.categories || {});
});

// Create category
router.post("/categories", requireAuth, requireRole("admin"), (req, res) => {
  const { type, item } = req.body;
  if (!type || !item || !item.id || !item.label) {
    return res.status(400).json({ error: "Type and item (with id and label) are required", code: "VALIDATION_ERROR" });
  }

  if (!db.categories[type]) {
    db.categories[type] = [];
  }

  const existingIdx = db.categories[type].findIndex((c) => c.id === item.id);
  if (existingIdx !== -1) {
    db.categories[type][existingIdx] = item;
  } else {
    db.categories[type].push(item);
  }

  if (typeof db.save === "function") db.save();
  return res.status(200).json({ success: true, categories: db.categories });
});
