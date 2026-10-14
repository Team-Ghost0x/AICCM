/**
 * Module 2: Creators & Portfolio Dossiers
 * GET  /api/creators          – Faceted search
 * GET  /api/creators/:handle  – Creator dossier
 * POST /api/creators          – Create creator profile
 * PATCH /api/creators/:id     – Update creator
 */
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

export const router = Router();

// ── 2.1 GET /api/creators ─────────────────────────────────────────────────────
router.get("/", (req, res) => {
  let creators = [...db.creators];

  const {
    q,
    specialization,
    tool,
    skill,
    contentType,
    format,
    availability,
    maxPriceInr,
    verifiedToolsOnly,
    sort,
    limit = 20,
    offset = 0,
  } = req.query;

  const relaxations = [];

  // Text search
  if (q) {
    const query = q.toLowerCase();
    const filtered = creators.filter(
      (c) =>
        c.displayName.toLowerCase().includes(query) ||
        c.headline.toLowerCase().includes(query) ||
        c.bio.toLowerCase().includes(query) ||
        c.skills.some((s) => s.toLowerCase().includes(query))
    );
    if (filtered.length === 0) {
      relaxations.push("Text search relaxed – showing all creators");
    } else {
      creators = filtered;
    }
  }

  // Specialization filter (comma-separated or array)
  if (specialization) {
    const specs = Array.isArray(specialization) ? specialization : specialization.split(",");
    creators = creators.filter((c) => specs.some((s) => c.specializations.includes(s)));
  }

  // Tool filter
  if (tool) {
    const tools = Array.isArray(tool) ? tool : tool.split(",");
    creators = creators.filter((c) =>
      tools.some((t) => c.tools.some((ct) => ct.name.toLowerCase().includes(t.toLowerCase())))
    );
  }

  // Skill filter
  if (skill) {
    const skills = Array.isArray(skill) ? skill : skill.split(",");
    creators = creators.filter((c) =>
      skills.some((sk) => c.skills.some((cs) => cs.toLowerCase().includes(sk.toLowerCase())))
    );
  }

  // Content type filter
  if (contentType) {
    const types = Array.isArray(contentType) ? contentType : contentType.split(",");
    creators = creators.filter((c) => types.some((t) => c.contentTypes.includes(t)));
  }

  // Format filter
  if (format) {
    const formats = Array.isArray(format) ? format : format.split(",");
    creators = creators.filter((c) => formats.some((f) => c.formats.includes(f)));
  }

  // Availability filter
  if (availability) {
    creators = creators.filter((c) => c.availability === availability);
  }

  // Max price filter
  if (maxPriceInr) {
    const max = parseInt(maxPriceInr, 10);
    creators = creators.filter((c) => c.priceFromInr <= max);
  }

  // Verified tools only
  if (verifiedToolsOnly === "true") {
    creators = creators.filter((c) =>
      c.tools.some((t) => t.verify === "evidence_attached" || t.verify === "reviewed")
    );
  }

  // Sorting
  if (sort === "price_low") {
    creators.sort((a, b) => a.priceFromInr - b.priceFromInr);
  } else if (sort === "price_high") {
    creators.sort((a, b) => b.priceFromInr - a.priceFromInr);
  } else if (sort === "turnaround") {
    creators.sort((a, b) => a.turnaroundDays - b.turnaroundDays);
  } else {
    // Default: recommended – open first, then by price
    creators.sort((a, b) => {
      const availOrder = { open: 0, limited: 1, booked: 2 };
      return (availOrder[a.availability] || 0) - (availOrder[b.availability] || 0);
    });
  }

  const total = creators.length;
  const paginated = creators.slice(Number(offset), Number(offset) + Number(limit));

  const allDbCreators = db.creators;
  const facets = {
    specialization: ["ai_film", "product_ads", "motion_graphics", "ai_animation", "fashion_lookbook", "social_shorts", "brand_mascots"].map((val) => ({
      value: val,
      count: allDbCreators.filter((c) => c.specializations?.includes(val)).length,
    })),
    tool: ["comfyui", "runway", "midjourney", "kling", "flux", "topaz", "magnific"].map((val) => ({
      value: val,
      count: allDbCreators.filter((c) => c.tools?.some((t) => t.name.toLowerCase().includes(val) || t.toolId.toLowerCase().includes(val))).length,
    })),
    contentType: ["video", "still", "animation"].map((val) => ({
      value: val,
      count: allDbCreators.filter((c) => c.contentTypes?.includes(val)).length,
    })),
    format: ["9:16", "16:9", "1:1", "4:5"].map((val) => ({
      value: val,
      count: allDbCreators.filter((c) => c.formats?.includes(val)).length,
    })),
    availability: ["open", "limited", "booked"].map((val) => ({
      value: val,
      count: allDbCreators.filter((c) => c.availability === val).length,
    })),
  };

  return res.status(200).json({
    items: paginated,
    creators: paginated,
    total,
    facets,
    relaxations,
  });
});

// ── 2.2 Saved Creators Shortlist ─────────────────────────────────────────────
router.get("/saved", requireAuth, (req, res) => {
  const saved = db.savedCreators.filter((s) => s.brandUserId === req.user.userId);
  const savedList = saved.map((s) => {
    const creator = db.findCreatorById(s.creatorId) || db.findCreatorByHandle(s.creatorHandle);
    return { ...s, creator };
  }).filter((s) => s.creator);
  return res.status(200).json({ saved: savedList, total: savedList.length });
});

router.post("/saved/:creatorId", requireAuth, (req, res) => {
  const creator = db.findCreatorById(req.params.creatorId) || db.findCreatorByHandle(req.params.creatorId);
  if (!creator) {
    return res.status(404).json({ error: "Creator not found", code: "NOT_FOUND" });
  }

  const existing = db.savedCreators.find(
    (s) => s.brandUserId === req.user.userId && (s.creatorId === creator.id || s.creatorHandle === creator.handle)
  );

  if (!existing) {
    const newSaved = {
      id: `sc_${uuidv4().slice(0, 8)}`,
      brandUserId: req.user.userId,
      creatorId: creator.id,
      creatorHandle: creator.handle,
      savedAt: new Date().toISOString(),
    };
    db.savedCreators.push(newSaved);
    if (typeof db.save === "function") db.save();
  }

  return res.status(201).json({ success: true, message: "Creator saved to shortlist" });
});

router.delete("/saved/:creatorId", requireAuth, (req, res) => {
  const index = db.savedCreators.findIndex(
    (s) => s.brandUserId === req.user.userId && (s.creatorId === req.params.creatorId || s.creatorHandle === req.params.creatorId)
  );

  if (index !== -1) {
    db.savedCreators.splice(index, 1);
    if (typeof db.save === "function") db.save();
  }

  return res.status(200).json({ success: true, message: "Creator removed from shortlist" });
});

// ── 2.3 GET /api/creators/:handle ────────────────────────────────────────────
router.get("/:handle", (req, res) => {
  const creator = db.findCreatorByHandle(req.params.handle);
  if (!creator) {
    return res.status(404).json({ error: "Creator not found", code: "CREATOR_NOT_FOUND" });
  }
  return res.status(200).json(creator);
});

// ── 2.3 POST /api/creators ────────────────────────────────────────────────────
router.post("/", requireAuth, requireRole("creator", "admin"), (req, res) => {
  const {
    handle,
    displayName,
    headline,
    bio,
    location,
    avatarUrl,
    specializations,
    skills,
    tools,
    contentTypes,
    formats,
    turnaroundDays,
    priceFromInr,
    availability,
  } = req.body;

  // Required field validation
  if (!handle || !displayName || !headline || !bio) {
    return res.status(400).json({
      error: "Missing required fields: handle, displayName, headline, bio",
      code: "VALIDATION_ERROR",
    });
  }

  // Check handle uniqueness
  if (db.findCreatorByHandle(handle)) {
    return res.status(409).json({
      error: "A creator with this handle already exists",
      code: "HANDLE_CONFLICT",
    });
  }

  const newCreator = {
    id: `cr_${uuidv4().slice(0, 8)}`,
    handle,
    displayName,
    headline,
    bio,
    location: location || null,
    avatarUrl: avatarUrl || null,
    specializations: specializations || [],
    skills: skills || [],
    tools: tools || [],
    contentTypes: contentTypes || [],
    formats: formats || [],
    turnaroundDays: turnaroundDays || 7,
    priceFromInr: priceFromInr || 0,
    availability: availability || "open",
    verification: {
      tools: "unverified",
      workflow: "unverified",
      pastWork: "unverified",
    },
    portfolio: [],
    isSample: false,
    createdAt: new Date().toISOString(),
  };

  db.creators.push(newCreator);
  if (typeof db.save === "function") db.save();

  return res.status(201).json(newCreator);
});

// ── 2.4 PATCH /api/creators/:id ──────────────────────────────────────────────
router.patch("/:id", requireAuth, requireRole("creator", "admin"), (req, res) => {
  const creator = db.findCreatorById(req.params.id);
  if (!creator) {
    return res.status(404).json({ error: "Creator not found", code: "CREATOR_NOT_FOUND" });
  }

  // Only the owning creator or an admin can update
  const user = db.findUserById(req.user.userId);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
  }

  // A creator can only update their own profile
  // (In production, creator profile would be linked to user account)
  // For this implementation, allow admin or the matched user by company name
  const isAdmin = req.user.role === "admin";
  const isOwner = user.name === creator.displayName || user.company === creator.displayName;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ error: "You can only update your own creator profile", code: "FORBIDDEN" });
  }

  const allowedFields = [
    "displayName", "headline", "bio", "location", "avatarUrl",
    "specializations", "skills", "tools", "contentTypes", "formats",
    "turnaroundDays", "priceFromInr", "availability", "verification", "portfolio",
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      creator[field] = req.body[field];
    }
  }

  creator.updatedAt = new Date().toISOString();
  if (typeof db.save === "function") db.save();

  return res.status(200).json(creator);
});

// ── 2.5 POST /api/creators/:id/portfolio ──────────────────────────────────────
router.post("/:id/portfolio", requireAuth, requireRole("creator", "admin"), (req, res) => {
  const creator = db.findCreatorById(req.params.id) || db.findCreatorByHandle(req.params.id);
  if (!creator) {
    return res.status(404).json({ error: "Creator not found", code: "NOT_FOUND" });
  }

  const { title, description, contentType, mediaUrl, aspectRatio, tools, prompt, workflowNotes } = req.body;

  if (!title || !mediaUrl) {
    return res.status(400).json({ error: "Title and mediaUrl are required", code: "VALIDATION_ERROR" });
  }

  const newProject = {
    id: `proj_${uuidv4().slice(0, 8)}`,
    title,
    description: description || "",
    contentType: contentType || "video",
    mediaUrl,
    aspectRatio: aspectRatio || "9:16",
    tools: tools || [],
    prompt: prompt || null,
    workflowNotes: workflowNotes || "",
    takesCount: 1,
    commercialCleared: true,
    published: true,
    createdAt: new Date().toISOString(),
  };

  creator.portfolio = [newProject, ...(creator.portfolio || [])];
  creator.updatedAt = new Date().toISOString();
  if (typeof db.save === "function") db.save();

  return res.status(201).json(newProject);
});

// ── 2.6 DELETE /api/creators/:id/portfolio/:projId ────────────────────────────
router.delete("/:id/portfolio/:projId", requireAuth, requireRole("creator", "admin"), (req, res) => {
  const creator = db.findCreatorById(req.params.id) || db.findCreatorByHandle(req.params.id);
  if (!creator) {
    return res.status(404).json({ error: "Creator not found", code: "NOT_FOUND" });
  }

  const index = (creator.portfolio || []).findIndex((p) => p.id === req.params.projId);
  if (index === -1) {
    return res.status(404).json({ error: "Portfolio project not found", code: "NOT_FOUND" });
  }

  creator.portfolio.splice(index, 1);
  creator.updatedAt = new Date().toISOString();
  if (typeof db.save === "function") db.save();

  return res.status(200).json({ success: true, message: "Project deleted from portfolio" });
});

// ── 2.7 POST /api/creators/:id/verifications ──────────────────────────────────
router.post("/:id/verifications", requireAuth, requireRole("creator"), (req, res) => {
  const creator = db.findCreatorById(req.params.id) || db.findCreatorByHandle(req.params.id);
  if (!creator) {
    return res.status(404).json({ error: "Creator not found", code: "NOT_FOUND" });
  }

  const { category, categoryLabel, evidenceUrl, description } = req.body;

  if (!category || !evidenceUrl) {
    return res.status(400).json({ error: "Category and evidenceUrl are required", code: "VALIDATION_ERROR" });
  }

  const newVer = {
    id: `ver_${uuidv4().slice(0, 8)}`,
    creatorId: creator.id,
    creatorName: creator.displayName,
    category,
    categoryLabel: categoryLabel || category,
    evidenceUrl,
    description: description || "",
    status: "pending",
    decisionReason: null,
    submittedAt: new Date().toISOString(),
    decidedAt: null,
    decidedBy: null,
  };

  db.verifications.unshift(newVer);
  db.addAuditLog("SYSTEM", req.user.userId, `Verification request submitted for ${creator.displayName}`);
  if (typeof db.save === "function") db.save();

  return res.status(201).json(newVer);
});

// ── 2.8 GET /api/creators/:id/verifications ───────────────────────────────────
router.get("/:id/verifications", requireAuth, (req, res) => {
  const creator = db.findCreatorById(req.params.id) || db.findCreatorByHandle(req.params.id);
  if (!creator) {
    return res.status(404).json({ error: "Creator not found", code: "NOT_FOUND" });
  }

  const requests = db.verifications.filter((v) => v.creatorId === creator.id || v.creatorId === req.user.userId);
  return res.status(200).json({ verifications: requests });
});
