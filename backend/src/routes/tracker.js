/**
 * Module 6: Tracker & Deliverables Lifecycle
 * GET   /api/tracker/:briefId                     – Get tracker state
 * POST  /api/tracker/:briefId/takes               – Submit take
 * PATCH /api/tracker/:briefId/takes/:n            – Approve or request changes
 * POST  /api/tracker/:briefId/deliverables/approve – Final sign-off
 */
import { Router } from "express";
import { createHash } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

export const router = Router();

// Helper: find or initialize tracker
function getOrCreateTracker(briefId, userId) {
  let tracker = db.findTrackerByBriefId(briefId);

  if (!tracker) {
    const brief = db.briefs.find((b) => b.id === briefId);
    if (!brief) return null;

    tracker = {
      id: `eng_${uuidv4().slice(0, 8)}`,
      briefId,
      creatorId: null,
      creatorUserId: userId,
      brandUserId: brief.brandId,
      stage: "proposal",
      takes: [],
      milestones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.trackers.push(tracker);
  }

  return tracker;
}

// Milestone progress & submitted takes
router.get("/:briefId", requireAuth, (req, res) => {
  const tracker = db.findTrackerByBriefId(req.params.briefId);

  if (!tracker) {
    return res.status(404).json({
      error: "No production tracker found for this brief",
      code: "TRACKER_NOT_FOUND",
    });
  }

  // Access control: only participants or admin
  const isAdmin = req.user.role === "admin";
  const isParticipant =
    tracker.brandUserId === req.user.userId ||
    tracker.creatorUserId === req.user.userId;

  if (!isAdmin && !isParticipant) {
    return res.status(403).json({
      error: "You are not a participant in this production",
      code: "FORBIDDEN",
    });
  }

  return res.status(200).json(tracker);
});

// Submit new iteration take
router.post("/:briefId/takes", requireAuth, requireRole("creator", "admin"), (req, res) => {
  const brief = db.briefs.find((b) => b.id === req.params.briefId);
  if (!brief) {
    return res.status(404).json({ error: "Brief not found", code: "BRIEF_NOT_FOUND" });
  }

  const tracker = getOrCreateTracker(req.params.briefId, req.user.userId);
  if (!tracker) {
    return res.status(404).json({ error: "Brief not found", code: "BRIEF_NOT_FOUND" });
  }

  const { n, note, tool, prompt, mediaUrl } = req.body;

  if (!n || !note || !tool || !mediaUrl) {
    return res.status(400).json({
      error: "Missing required fields: n, note, tool, mediaUrl",
      code: "VALIDATION_ERROR",
    });
  }

  // Check for duplicate take number
  if (tracker.takes.some((t) => t.n === n)) {
    return res.status(409).json({
      error: `Take #${n} already exists for this brief`,
      code: "TAKE_DUPLICATE",
    });
  }

  const newTake = {
    n,
    note,
    tool,
    prompt: prompt || null,
    mediaUrl,
    status: "submitted",
    feedback: null,
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
  };

  tracker.takes.push(newTake);
  tracker.takes.sort((a, b) => a.n - b.n);
  tracker.stage = "review";
  tracker.updatedAt = new Date().toISOString();

  db.addAuditLog("SYSTEM", req.user.userId, `Take #${n} submitted for brief ${req.params.briefId}`);
  if (typeof db.save === "function") db.save();

  return res.status(201).json(newTake);
});

// Review take (approve / request revisions)
router.patch("/:briefId/takes/:n", requireAuth, requireRole("brand", "admin"), (req, res) => {
  const tracker = db.findTrackerByBriefId(req.params.briefId);
  if (!tracker) {
    return res.status(404).json({
      error: "No production tracker found for this brief",
      code: "TRACKER_NOT_FOUND",
    });
  }

  const takeN = parseInt(req.params.n, 10);
  const take = tracker.takes.find((t) => t.n === takeN);
  if (!take) {
    return res.status(404).json({ error: `Take #${takeN} not found`, code: "TAKE_NOT_FOUND" });
  }

  const { status, feedback } = req.body;

  const validStatuses = ["approved", "changes_requested", "rejected"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      code: "VALIDATION_ERROR",
    });
  }

  take.status = status;
  take.feedback = feedback || null;
  take.reviewedAt = new Date().toISOString();

  // Update tracker stage based on review outcome
  if (status === "approved") {
    tracker.stage = "in_production";
  } else if (status === "changes_requested") {
    tracker.stage = "in_production"; // Creator must revise
  }

  tracker.updatedAt = new Date().toISOString();
  db.addAuditLog("SYSTEM", req.user.userId, `Take #${takeN} marked "${status}" for brief ${req.params.briefId}`);
  if (typeof db.save === "function") db.save();

  return res.status(200).json(take);
});

// Final deliverable sign-off
router.post("/:briefId/deliverables/approve", requireAuth, requireRole("brand", "admin"), (req, res) => {
  const tracker = db.findTrackerByBriefId(req.params.briefId);
  if (!tracker) {
    return res.status(404).json({
      error: "No production tracker found for this brief",
      code: "TRACKER_NOT_FOUND",
    });
  }

  const { masterPieceId, clearanceConfirmed } = req.body;

  if (!clearanceConfirmed) {
    return res.status(400).json({
      error: "clearanceConfirmed must be true to proceed with final approval",
      code: "CLEARANCE_NOT_CONFIRMED",
    });
  }

  // Advance stage to delivered
  tracker.stage = "delivered";
  tracker.deliveredAt = new Date().toISOString();
  tracker.masterPieceId = masterPieceId || null;
  tracker.updatedAt = new Date().toISOString();

  // Issue a rights certificate
  const certId = `RTK-CERT-${uuidv4().slice(0, 4).toUpperCase()}-${new Date().getFullYear()}`;

  const brief = db.briefs.find((b) => b.id === req.params.briefId);
  const brandUser = db.findUserById(req.user.userId);

  const cert = {
    id: certId,
    briefId: req.params.briefId,
    campaignTitle: brief ? brief.title : "Unknown Campaign",
    brandName: brandUser ? brandUser.name : "Unknown Brand",
    creatorId: tracker.creatorId,
    hash: "",
    issuedAt: new Date().toISOString(),
    status: "VERIFIED_AUTHENTIC",
    commercialUse: brief ? brief.commercialUse : null,
    spec: {
      campaignTitle: brief ? brief.title : "Unknown Campaign",
      brandName: brandUser ? brandUser.name : "Unknown Brand",
      noModelTrainingWarranty: brief?.commercialUse?.noModelTraining ?? true,
      signatureValid: true,
    },
  };

  // Generate SHA-256 hash from cert data
  const certData = JSON.stringify({ id: certId, briefId: req.params.briefId, issuedAt: cert.issuedAt });
  cert.hash = createHash("sha256").update(certData).digest("hex");

  db.rightsCertificates.push(cert);

  // Auto-release final milestone escrow
  const pendingLocks = db.transactions.filter(
    (t) =>
      t.type === "escrow_lock" &&
      t.briefId === req.params.briefId &&
      t.status === "completed"
  );

  let escrowReleased = false;
  for (const lock of pendingLocks) {
    const alreadyReleased = db.transactions.some(
      (t) => t.type === "escrow_release" && t.milestoneId === lock.milestoneId
    );
    if (!alreadyReleased) {
      db.transactions.push({
        id: `tx_${uuidv4().slice(0, 8)}`,
        userId: req.user.userId,
        type: "escrow_release",
        amountInr: lock.amountInr,
        campaign: lock.campaign,
        creatorOrBrand: lock.creatorOrBrand,
        status: "completed",
        date: new Date().toISOString(),
        method: "Escrow",
        briefId: req.params.briefId,
        creatorId: lock.creatorId,
        milestoneId: lock.milestoneId,
      });
      escrowReleased = true;
    }
  }

  // Update brief status
  if (brief) brief.status = "closed";

  db.addAuditLog("ESCROW", req.user.userId, `Final deliverables approved for brief ${req.params.briefId} – certificate ${certId} issued`);
  if (typeof db.save === "function") db.save();

  return res.status(200).json({
    success: true,
    stage: "delivered",
    certificateId: certId,
    escrowPayoutReleased: escrowReleased,
  });
});
