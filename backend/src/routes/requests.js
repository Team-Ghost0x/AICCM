/**
 * Module 4a: Communications – Requests
 * GET   /api/requests       – List inbound/outbound requests
 * POST  /api/requests       – Dispatch inquiry to creator
 * PATCH /api/requests/:id   – Accept or decline
 */
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

export const router = Router();

// List user communication requests
router.get("/", requireAuth, (req, res) => {
  const { status } = req.query;
  const userId = req.user.userId;

  let requests = db.communicationRequests.filter(
    (r) => r.fromUserId === userId || r.toUserId === userId
  );

  if (status) {
    requests = requests.filter((r) => r.status === status);
  }

  return res.status(200).json({ requests, total: requests.length });
});

// Send proposal inquiry to creator
router.post("/", requireAuth, requireRole("brand", "admin"), (req, res) => {
  const { creatorId, briefId, projectTitle, proposedBudgetInr, targetDeadline, message } = req.body;

  if (!creatorId || !projectTitle || !message) {
    return res.status(400).json({
      error: "Missing required fields: creatorId, projectTitle, message",
      code: "VALIDATION_ERROR",
    });
  }

  // Find creator
  const creator = db.findCreatorById(creatorId);
  if (!creator) {
    return res.status(404).json({ error: "Creator not found", code: "CREATOR_NOT_FOUND" });
  }

  // Find the creator's linked user account (match by company/displayName)
  const creatorUser = db.users.find(
    (u) => u.role === "creator" && (u.company === creator.displayName || u.name === creator.displayName)
  );

  const senderUser = db.findUserById(req.user.userId);

  const newRequest = {
    id: `req_${uuidv4().slice(0, 8)}`,
    fromUserId: req.user.userId,
    fromUserName: senderUser ? senderUser.name : "Unknown",
    fromUserRole: req.user.role,
    fromCompany: senderUser ? senderUser.company : null,
    toUserId: creatorUser ? creatorUser.id : `usr_creator_${creatorId}`,
    toUserName: creator.displayName,
    toUserRole: "creator",
    briefId: briefId || null,
    projectTitle,
    proposedBudgetInr: proposedBudgetInr || null,
    targetDeadline: targetDeadline || null,
    message,
    status: "pending",
    threadId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.communicationRequests.push(newRequest);
  db.addAuditLog("COMMS", req.user.userId, `Communication request ${newRequest.id} dispatched to creator ${creatorId}`);
  if (typeof db.save === "function") db.save();

  return res.status(201).json(newRequest);
});

// Accept or decline inquiry
router.patch("/:id", requireAuth, requireRole("creator", "admin"), (req, res) => {
  const request = db.communicationRequests.find((r) => r.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: "Request not found", code: "REQUEST_NOT_FOUND" });
  }

  const { status, reason } = req.body;

  const validStatuses = ["accepted", "declined"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      code: "VALIDATION_ERROR",
    });
  }

  request.status = status;
  request.reason = reason || null;
  request.updatedAt = new Date().toISOString();

  // Auto-create a MessageThread when accepted
  if (status === "accepted") {
    const fromUser = db.findUserById(request.fromUserId);
    const toUser = db.findUserById(request.toUserId);

    const newThread = {
      id: `th_${uuidv4().slice(0, 8)}`,
      requestId: request.id,
      projectTitle: request.projectTitle,
      status: "in_production",
      participants: [
        {
          id: request.fromUserId,
          name: request.fromUserName,
          role: request.fromUserRole,
          company: request.fromCompany,
          avatarUrl: fromUser ? fromUser.avatarUrl || null : null,
        },
        {
          id: request.toUserId,
          name: request.toUserName,
          role: request.toUserRole,
          company: toUser ? toUser.company : null,
          avatarUrl: toUser ? toUser.avatarUrl || null : null,
        },
      ],
      budgetInr: request.proposedBudgetInr,
      lastMessage: `Request accepted: ${reason || "Looking forward to collaborating!"}`,
      lastMessageAt: new Date().toISOString(),
      unreadCount: { [request.fromUserId]: 1, [request.toUserId]: 0 },
      messages: [
        {
          id: `msg_${uuidv4().slice(0, 8)}`,
          threadId: "", // will be set below
          senderId: request.toUserId,
          senderName: request.toUserName,
          senderRole: "creator",
          text: reason || "Looking forward to collaborating on this project!",
          attachments: [],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    newThread.messages[0].threadId = newThread.id;
    request.threadId = newThread.id;
    db.threads.push(newThread);

    db.addAuditLog("COMMS", req.user.userId, `Request ${request.id} accepted – thread ${newThread.id} created`);
  }

  if (typeof db.save === "function") db.save();
  return res.status(200).json(request);
});
