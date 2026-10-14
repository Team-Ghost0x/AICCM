/**
 * Module 4b: Communications – Threads & Messages
 * GET  /api/threads              – List all threads for user
 * GET  /api/threads/:id          – Get thread with messages
 * POST /api/threads/:id/messages – Send a message
 */
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { requireAuth } from "../auth.js";

export const router = Router();

// ── 4.4 GET /api/threads ──────────────────────────────────────────────────────
router.get("/", requireAuth, (req, res) => {
  const userId = req.user.userId;

  const threads = db.threads
    .filter((t) => t.participants.some((p) => p.id === userId))
    .map(({ messages, ...thread }) => ({
      ...thread,
      // Omit full messages from list view for performance
      messages: [],
    }));

  return res.status(200).json({ threads });
});

// ── 4.5 GET /api/threads/:id ──────────────────────────────────────────────────
router.get("/:id", requireAuth, (req, res) => {
  const thread = db.threads.find((t) => t.id === req.params.id);
  if (!thread) {
    return res.status(404).json({ error: "Thread not found", code: "THREAD_NOT_FOUND" });
  }

  // Participant check
  const isParticipant = thread.participants.some((p) => p.id === req.user.userId);
  const isAdmin = req.user.role === "admin";

  if (!isParticipant && !isAdmin) {
    return res.status(403).json({
      error: "You are not a participant in this thread",
      code: "FORBIDDEN",
    });
  }

  // Mark as read for this user
  if (thread.unreadCount && thread.unreadCount[req.user.userId]) {
    thread.unreadCount[req.user.userId] = 0;
  }

  return res.status(200).json(thread);
});

// ── 4.6 POST /api/threads/:id/messages ────────────────────────────────────────
router.post("/:id/messages", requireAuth, (req, res) => {
  const thread = db.threads.find((t) => t.id === req.params.id);
  if (!thread) {
    return res.status(404).json({ error: "Thread not found", code: "THREAD_NOT_FOUND" });
  }

  // Participant check
  const isParticipant = thread.participants.some((p) => p.id === req.user.userId);
  const isAdmin = req.user.role === "admin";

  if (!isParticipant && !isAdmin) {
    return res.status(403).json({
      error: "You are not a participant in this thread",
      code: "FORBIDDEN",
    });
  }

  const { text, attachments } = req.body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({
      error: "Message text is required",
      code: "VALIDATION_ERROR",
    });
  }

  const sender = db.findUserById(req.user.userId);

  const newMessage = {
    id: `msg_${uuidv4().slice(0, 8)}`,
    threadId: thread.id,
    senderId: req.user.userId,
    senderName: sender ? sender.name : req.user.email,
    senderRole: req.user.role,
    text: text.trim(),
    attachments: attachments || [],
    timestamp: new Date().toISOString(),
  };

  thread.messages.push(newMessage);
  thread.lastMessage = text.trim().slice(0, 100);
  thread.lastMessageAt = newMessage.timestamp;

  // Increment unread for all other participants
  for (const participant of thread.participants) {
    if (participant.id !== req.user.userId) {
      thread.unreadCount[participant.id] = (thread.unreadCount[participant.id] || 0) + 1;
    }
  }

  if (typeof db.save === "function") db.save();
  return res.status(201).json(newMessage);
});
