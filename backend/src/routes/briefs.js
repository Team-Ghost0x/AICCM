/**
 * Module 3: Production Briefs & Matchmaking
 * POST /api/briefs/draft        – AI natural language brief parser
 * POST /api/briefs              – Create and publish brief
 * GET  /api/briefs              – List briefs
 * GET  /api/briefs/:id          – Get brief
 * PATCH /api/briefs/:id         – Update brief
 * GET  /api/briefs/:id/matches  – AI-ranked creator matches
 */
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { requireAuth, requireRole, optionalAuth } from "../auth.js";

export const router = Router();

// Helper: extracts structured parameters from natural language descriptions
function parseBriefIdea(idea) {
  const text = idea.toLowerCase();

  // Content type detection
  let contentType = "video";
  if (text.includes("still") || text.includes("photo") || text.includes("image")) contentType = "still";
  else if (text.includes("animation") || text.includes("animated")) contentType = "animation";
  else if (text.includes("audio") || text.includes("music") || text.includes("sound")) contentType = "audio";

  // Format detection
  const formats = [];
  if (text.includes("9:16") || text.includes("reel") || text.includes("story") || text.includes("vertical")) {
    formats.push({ aspectRatio: "9:16", durationSec: 15 });
  }
  if (text.includes("16:9") || text.includes("landscape") || text.includes("cinematic") || text.includes("widescreen")) {
    formats.push({ aspectRatio: "16:9", durationSec: 30 });
  }
  if (text.includes("1:1") || text.includes("square")) {
    formats.push({ aspectRatio: "1:1", durationSec: 15 });
  }
  if (formats.length === 0) formats.push({ aspectRatio: "16:9", durationSec: 30 });

  // Duration detection
  const durationMatch = text.match(/(\d+)s(?:ec)?/);
  const duration = durationMatch ? parseInt(durationMatch[1], 10) : 30;

  // Budget estimation based on complexity keywords
  let budget = 50000;
  if (text.includes("luxury") || text.includes("premium") || text.includes("cinematic")) budget = 75000;
  if (text.includes("campaign") || text.includes("commercial")) budget = 90000;
  if (text.includes("series") || text.includes("multiple")) budget = 120000;

  // Turnaround
  let turnaroundDays = 7;
  if (text.includes("urgent") || text.includes("rush") || text.includes("quick")) turnaroundDays = 3;
  if (text.includes("complex") || text.includes("detailed") || text.includes("premium")) turnaroundDays = 10;

  // Deliverables
  const deliverables = [];
  if (formats.find((f) => f.aspectRatio === "16:9")) {
    deliverables.push(`1x ${duration}s Master Commercial (16:9 4K)`);
  }
  if (formats.find((f) => f.aspectRatio === "9:16")) {
    deliverables.push(`2x ${Math.floor(duration / 2)}s Cutdowns (9:16 Social Reels)`);
  }
  if (deliverables.length === 0) {
    deliverables.push(`1x ${duration}s Primary Deliverable`);
  }

  // Title generation from idea
  const words = idea.split(" ").slice(0, 8).join(" ");
  const title = words.charAt(0).toUpperCase() + words.slice(1);

  return {
    title,
    contentType,
    deliverables,
    formats,
    budget,
    turnaroundDays,
  };
}

// Generate contextual clarifying questions
function generateQuestions(idea) {
  const text = idea.toLowerCase();
  const questions = [];

  if (text.includes("product") || text.includes("bottle") || text.includes("pack")) {
    questions.push("Do you have a physical product 3D CAD model, reference photos, or existing brand assets?");
  }
  if (text.includes("perfume") || text.includes("fragrance") || text.includes("beverage") || text.includes("luxury")) {
    questions.push("Will you require an original synthetic AI voiceover or soundtrack?");
  }
  if (text.includes("person") || text.includes("talent") || text.includes("model") || text.includes("face")) {
    questions.push("Do you require a consistent human identity (face, character) throughout the content?");
  }
  if (text.includes("reel") || text.includes("social") || text.includes("instagram")) {
    questions.push("Which social platforms are the primary distribution channels (Instagram, TikTok, YouTube Shorts)?");
  }
  if (questions.length < 2) {
    questions.push("What is your preferred visual style direction? (e.g., hyper-realistic, stylized, abstract)");
    questions.push("Do you have an existing brand style guide or color palette to adhere to?");
  }

  return questions;
}

// Generate structured brief draft from concept
router.post("/draft", (req, res) => {
  const { idea } = req.body;

  if (!idea || typeof idea !== "string" || idea.trim().length < 10) {
    return res.status(400).json({
      error: "A descriptive idea string is required (minimum 10 characters)",
      code: "VALIDATION_ERROR",
    });
  }

  const draft = parseBriefIdea(idea.trim());
  const questions = generateQuestions(idea.trim());

  return res.status(200).json({ draft, questions });
});

// Publish creative brief
router.post("/", requireAuth, requireRole("brand", "admin"), async (req, res) => {
  const {
    title,
    brandName,
    objective,
    requirements,
    contentType,
    styleTags,
    referenceUrls,
    formats,
    deliverablesCount,
    preferredTools,
    budgetInr,
    deadline,
    commercialUse,
  } = req.body;

  if (!title || !objective || !contentType) {
    return res.status(400).json({
      error: "Missing required fields: title, objective, contentType",
      code: "VALIDATION_ERROR",
    });
  }

  const user = db.findUserById(req.user.userId);

  const newBrief = {
    id: `br_${uuidv4().slice(0, 8)}`,
    brandId: req.user.userId,
    brandName: brandName || (user ? user.name : "Unknown Brand"),
    title,
    objective,
    requirements: requirements || "",
    contentType,
    styleTags: styleTags || [],
    referenceUrls: referenceUrls || [],
    formats: formats || [],
    deliverablesCount: deliverablesCount || 1,
    preferredTools: preferredTools || [],
    budgetInr: budgetInr || null,
    deadline: deadline || null,
    commercialUse: commercialUse || null,
    status: "open",
    createdAt: new Date().toISOString(),
  };

  await db.addBrief(newBrief);
  db.addAuditLog("SYSTEM", req.user.userId, `Brief "${title}" published by ${newBrief.brandName}`);

  return res.status(201).json(newBrief);
});

// Get briefs list with filters
router.get("/", optionalAuth, (req, res) => {
  const { status, brandId, limit = 20, offset = 0 } = req.query;

  let briefs = [...db.briefs];

  if (status) {
    briefs = briefs.filter((b) => b.status === status);
  }

  if (brandId) {
    briefs = briefs.filter((b) => b.brandId === brandId);
  }

  // Filter based on authentication:
  // - Admins see all briefs
  // - Authenticated users see open briefs + their own briefs
  // - Unauthenticated guests see open briefs
  if (!req.user) {
    briefs = briefs.filter((b) => b.status === "open");
  } else if (req.user.role !== "admin") {
    briefs = briefs.filter(
      (b) => b.status === "open" || b.brandId === req.user.userId
    );
  }

  const total = briefs.length;
  const paginated = briefs.slice(Number(offset), Number(offset) + Number(limit));

  return res.status(200).json({ briefs: paginated, total });
});

// Get brief details
router.get("/:id", optionalAuth, (req, res) => {
  const brief = db.briefs.find((b) => b.id === req.params.id);
  if (!brief) {
    return res.status(404).json({ error: "Brief not found", code: "BRIEF_NOT_FOUND" });
  }
  return res.status(200).json(brief);
});

// Update brief
router.patch("/:id", requireAuth, requireRole("brand", "admin"), (req, res) => {
  const brief = db.briefs.find((b) => b.id === req.params.id);
  if (!brief) {
    return res.status(404).json({ error: "Brief not found", code: "BRIEF_NOT_FOUND" });
  }

  if (req.user.role !== "admin" && brief.brandId !== req.user.userId) {
    return res.status(403).json({ error: "You can only update your own briefs", code: "FORBIDDEN" });
  }

  const allowedFields = [
    "title", "objective", "requirements", "contentType", "styleTags",
    "referenceUrls", "formats", "deliverablesCount", "preferredTools",
    "budgetInr", "deadline", "commercialUse", "status",
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      brief[field] = req.body[field];
    }
  }

  brief.updatedAt = new Date().toISOString();
  if (typeof db.save === "function") db.save();

  return res.status(200).json(brief);
});

// Algorithmic creator matching for brief
router.get("/:id/matches", requireAuth, (req, res) => {
  const brief = db.briefs.find((b) => b.id === req.params.id);
  if (!brief) {
    return res.status(404).json({ error: "Brief not found", code: "BRIEF_NOT_FOUND" });
  }

  // Algorithmic creator matching
  const scored = db.creators
    .filter((c) => c.availability !== "booked")
    .map((creator) => {
      let score = 50; // Base score
      const reasons = [];

      // Tool match
      if (brief.preferredTools && brief.preferredTools.length > 0) {
        const creatorToolNames = creator.tools.map((t) => t.name.toLowerCase());
        const matchedTools = brief.preferredTools.filter((t) =>
          creatorToolNames.some((ct) => ct.includes(t.toLowerCase()))
        );
        if (matchedTools.length > 0) {
          score += matchedTools.length * 12;
          reasons.push(`Verified mastery in ${matchedTools.join(", ")}`);
        }
      }

      // Content type match
      if (brief.contentType && creator.contentTypes.includes(brief.contentType)) {
        score += 10;
        reasons.push(`Specializes in ${brief.contentType} content`);
      }

      // Budget match
      if (brief.budgetInr && creator.priceFromInr <= brief.budgetInr.max) {
        score += 8;
        reasons.push(`Budget within target bracket (₹${creator.priceFromInr.toLocaleString("en-IN")} base)`);
      }

      // Deadline / turnaround match
      if (brief.deadline) {
        const daysUntilDeadline = Math.ceil(
          (new Date(brief.deadline) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (creator.turnaroundDays <= daysUntilDeadline) {
          score += 8;
          reasons.push(`Turnaround time of ${creator.turnaroundDays} days matches target deadline`);
        }
      }

      // Availability bonus
      if (creator.availability === "open") {
        score += 6;
        reasons.push("Currently open and immediately available");
      }

      // Verification bonus
      if (creator.verification.tools === "reviewed") score += 5;
      if (creator.verification.workflow === "evidence_attached") score += 3;
      if (creator.verification.pastWork === "reviewed") score += 3;

      // Style tag match
      if (brief.styleTags) {
        const specializationMap = {
          cyberpunk: "motion_graphics",
          macro: "product_ads",
          liquid_dynamics: "product_ads",
          cinematic: "ai_film",
          fashion: "fashion_lookbook",
          animation: "ai_animation",
        };
        const matchedSpecs = brief.styleTags
          .map((tag) => specializationMap[tag])
          .filter(Boolean);
        const creatorSpecMatch = matchedSpecs.filter((spec) =>
          creator.specializations.includes(spec)
        );
        if (creatorSpecMatch.length > 0) {
          score += creatorSpecMatch.length * 5;
          reasons.push("Specialization aligns with campaign style direction");
        }
      }

      // Cap at 99
      score = Math.min(99, score);

      if (reasons.length === 0) reasons.push("General AI content creation capability");

      return {
        creator: {
          id: creator.id,
          handle: creator.handle,
          displayName: creator.displayName,
          avatarUrl: creator.avatarUrl,
          priceFromInr: creator.priceFromInr,
          turnaroundDays: creator.turnaroundDays,
          availability: creator.availability,
        },
        score,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);

  return res.status(200).json(scored);
});

// Get applications for a brief
router.get("/:id/applications", requireAuth, (req, res) => {
  const brief = db.briefs.find((b) => b.id === req.params.id);
  if (!brief) {
    return res.status(404).json({ error: "Brief not found", code: "NOT_FOUND" });
  }

  // Brand owner, applicant creator, or admin can view
  const isAdmin = req.user.role === "admin";
  const isOwner = brief.brandId === req.user.userId;

  let apps = db.applications.filter((a) => a.briefId === req.params.id);

  if (!isAdmin && !isOwner) {
    // Creator can only see their own application
    apps = apps.filter((a) => a.creatorId === req.user.userId);
  }

  return res.status(200).json({ applications: apps, total: apps.length });
});

// Submit application proposal
router.post("/:id/applications", requireAuth, requireRole("creator"), (req, res) => {
  const brief = db.briefs.find((b) => b.id === req.params.id);
  if (!brief) {
    return res.status(404).json({ error: "Brief not found", code: "NOT_FOUND" });
  }

  if (brief.status !== "open") {
    return res.status(400).json({
      error: "This brief is no longer accepting applications",
      code: "BRIEF_NOT_OPEN",
    });
  }

  // Prevent duplicate active application
  const existing = db.applications.find(
    (a) => a.briefId === req.params.id && a.creatorId === req.user.userId && a.status !== "withdrawn"
  );
  if (existing) {
    return res.status(409).json({
      error: "You have already submitted an active proposal for this brief",
      code: "DUPLICATE_APPLICATION",
    });
  }

  const { proposedPriceInr, deliveryDays, proposalText, relevantTools, portfolioReferences } = req.body;

  if (!proposalText || proposalText.trim().length < 10) {
    return res.status(400).json({
      error: "Proposal text is required (minimum 10 characters)",
      code: "VALIDATION_ERROR",
    });
  }

  const user = db.findUserById(req.user.userId);
  const creator = db.creators.find((c) => c.displayName === user?.name || c.id === req.user.userId);

  const newApp = {
    id: `app_${uuidv4().slice(0, 8)}`,
    briefId: brief.id,
    briefTitle: brief.title,
    creatorId: req.user.userId,
    creatorHandle: creator ? creator.handle : user?.name.toLowerCase().replace(/\s+/g, "-"),
    creatorName: user ? user.name : "AI Creator",
    creatorAvatar: creator?.avatarUrl || null,
    proposedPriceInr: proposedPriceInr ? Number(proposedPriceInr) : (brief.budgetInr?.min || 30000),
    deliveryDays: deliveryDays ? Number(deliveryDays) : 7,
    proposalText: proposalText.trim(),
    relevantTools: relevantTools || (creator?.tools ? creator.tools.map(t => t.name) : ["ComfyUI"]),
    portfolioReferences: portfolioReferences || [],
    status: "submitted",
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.applications.push(newApp);
  db.addAuditLog("SYSTEM", req.user.userId, `Proposal submitted for brief "${brief.title}"`);
  if (typeof db.save === "function") db.save();

  return res.status(201).json(newApp);
});

// Update proposal status
router.patch("/:id/applications/:appId", requireAuth, (req, res) => {
  const brief = db.briefs.find((b) => b.id === req.params.id);
  if (!brief) {
    return res.status(404).json({ error: "Brief not found", code: "NOT_FOUND" });
  }

  const app = db.applications.find((a) => a.id === req.params.appId && a.briefId === req.params.id);
  if (!app) {
    return res.status(404).json({ error: "Application not found", code: "NOT_FOUND" });
  }

  const isOwner = brief.brandId === req.user.userId;
  const isAdmin = req.user.role === "admin";
  const isApplicant = app.creatorId === req.user.userId;

  const { status } = req.body;
  const validStatuses = ["under_review", "shortlisted", "accepted", "rejected", "withdrawn"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status", code: "VALIDATION_ERROR" });
  }

  // Creators can only withdraw their own application
  if (isApplicant && status === "withdrawn") {
    app.status = "withdrawn";
    app.updatedAt = new Date().toISOString();
    if (typeof db.save === "function") db.save();
    return res.status(200).json(app);
  }

  // Only brand owner or admin can shortlist, accept, or reject
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "Only the brief owner can review applications", code: "FORBIDDEN" });
  }

  app.status = status;
  app.updatedAt = new Date().toISOString();

  // If accepted, initialize project engagement
  if (status === "accepted") {
    let tracker = db.findTrackerByBriefId(brief.id);
    if (!tracker) {
      tracker = {
        id: `eng_${uuidv4().slice(0, 8)}`,
        briefId: brief.id,
        creatorId: app.creatorId,
        creatorUserId: app.creatorId,
        brandUserId: brief.brandId,
        stage: "in_production",
        agreedBudgetInr: app.proposedPriceInr,
        agreedDeadline: new Date(Date.now() + app.deliveryDays * 86400000).toISOString().slice(0, 10),
        takes: [],
        milestones: [
          { name: "Look Development & Takes", status: "in_progress", dueDays: 3 },
          { name: "Final 4K Master Deliverable", status: "pending", dueDays: app.deliveryDays },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.trackers.push(tracker);
    } else {
      tracker.stage = "in_production";
      tracker.creatorUserId = app.creatorId;
    }
  }

  if (typeof db.save === "function") db.save();
  return res.status(200).json(app);
});
