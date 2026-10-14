/**
 * Module 5: Escrow, Payments & Studio Wallet
 * GET  /api/payments/wallet           – Wallet balance & escrow
 * GET  /api/payments/transactions     – Transaction ledger
 * POST /api/payments/deposit          – Deposit funds
 * POST /api/payments/escrow/lock      – Lock funds into escrow
 * POST /api/payments/escrow/release   – Release escrow to creator
 */
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

export const router = Router();

// Helper: calculate wallet state for user
function computeWallet(userId) {
  const user = db.findUserById(userId);
  if (!user) return null;

  // Locked escrow: sum of escrow_lock transactions not yet released
  const lockedEscrow = db.transactions
    .filter(
      (t) =>
        t.userId === userId &&
        t.type === "escrow_lock" &&
        t.status === "completed"
    )
    .reduce((sum, t) => {
      // Check if this lock has been released
      const released = db.transactions.some(
        (rt) =>
          rt.userId === userId &&
          rt.type === "escrow_release" &&
          rt.milestoneId === t.milestoneId &&
          rt.status === "completed"
      );
      return released ? sum : sum + t.amountInr;
    }, 0);

  // Pending payouts (creator side: escrow releases pending bank transfer)
  const pendingPayouts = db.transactions
    .filter(
      (t) =>
        t.userId === userId &&
        t.type === "escrow_release" &&
        t.status === "pending_payout"
    )
    .reduce((sum, t) => sum + t.amountInr, 0);

  return {
    balanceInr: user.balanceInr,
    lockedEscrowInr: lockedEscrow,
    credits: user.credits,
    pendingPayoutsInr: pendingPayouts,
  };
}

// User wallet balance and escrow
router.get("/wallet", requireAuth, (req, res) => {
  const wallet = computeWallet(req.user.userId);
  if (!wallet) {
    return res.status(404).json({ error: "User not found", code: "USER_NOT_FOUND" });
  }
  return res.status(200).json(wallet);
});

// Transaction ledger history
router.get("/transactions", requireAuth, (req, res) => {
  const { limit = 20, offset = 0, type } = req.query;

  let transactions = db.transactions.filter((t) => t.userId === req.user.userId);

  if (type) {
    transactions = transactions.filter((t) => t.type === type);
  }

  // Sort descending by date
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = transactions.length;
  const paginated = transactions.slice(Number(offset), Number(offset) + Number(limit));

  // Return public-safe transaction shape
  const publicTxns = paginated.map(({ userId: _uid, ...t }) => t);

  return res.status(200).json({ transactions: publicTxns, total });
});

// Deposit funds via UPI or Card
router.post("/deposit", requireAuth, requireRole("brand", "admin"), (req, res) => {
  const { amountInr, method, vpa, cardLast4 } = req.body;

  if (!amountInr || typeof amountInr !== "number" || amountInr <= 0) {
    return res.status(400).json({
      error: "amountInr must be a positive integer",
      code: "VALIDATION_ERROR",
    });
  }

  if (!method || !["UPI", "Card", "NEFT", "RTGS"].includes(method)) {
    return res.status(400).json({
      error: "method must be one of: UPI, Card, NEFT, RTGS",
      code: "VALIDATION_ERROR",
    });
  }

  const user = db.findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found", code: "USER_NOT_FOUND" });
  }

  const txn = {
    id: `tx_${uuidv4().slice(0, 8)}`,
    userId: req.user.userId,
    type: "deposit",
    amountInr,
    campaign: null,
    creatorOrBrand: null,
    status: "completed",
    date: new Date().toISOString(),
    method,
    vpa: vpa || null,
    cardLast4: cardLast4 || null,
    gatewayRef: `GW_${uuidv4().slice(0, 12).toUpperCase()}`,
  };

  // Credit the user's wallet
  user.balanceInr += amountInr;
  db.transactions.push(txn);
  db.addAuditLog("ESCROW", req.user.userId, `Wallet deposit ₹${amountInr.toLocaleString("en-IN")} via ${method}`);
  if (typeof db.save === "function") db.save();

  const { userId: _uid, ...publicTxn } = txn;

  return res.status(201).json({
    transaction: publicTxn,
    newBalanceInr: user.balanceInr,
    message: `₹${amountInr.toLocaleString("en-IN")} successfully deposited via ${method}`,
  });
});

// Lock milestone escrow funds
router.post("/escrow/lock", requireAuth, requireRole("brand", "admin"), (req, res) => {
  const { briefId, creatorId, amountInr, milestoneTitle } = req.body;

  if (!briefId || !creatorId || !amountInr || !milestoneTitle) {
    return res.status(400).json({
      error: "Missing required fields: briefId, creatorId, amountInr, milestoneTitle",
      code: "VALIDATION_ERROR",
    });
  }

  const user = db.findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found", code: "USER_NOT_FOUND" });
  }

  // Check sufficient balance
  if (user.balanceInr < amountInr) {
    return res.status(400).json({
      error: `Insufficient wallet balance. Available: ₹${user.balanceInr.toLocaleString("en-IN")}`,
      code: "INSUFFICIENT_BALANCE",
    });
  }

  // Verify brief exists
  const brief = db.briefs.find((b) => b.id === briefId);
  if (!brief) {
    return res.status(404).json({ error: "Brief not found", code: "BRIEF_NOT_FOUND" });
  }

  const milestoneId = `ms_${uuidv4().slice(0, 8)}`;

  const txn = {
    id: `tx_${uuidv4().slice(0, 8)}`,
    userId: req.user.userId,
    type: "escrow_lock",
    amountInr,
    campaign: brief.title,
    creatorOrBrand: db.findCreatorById(creatorId)?.displayName || creatorId,
    status: "completed",
    date: new Date().toISOString(),
    method: "Escrow",
    briefId,
    creatorId,
    milestoneTitle,
    milestoneId,
  };

  // Deduct from wallet
  user.balanceInr -= amountInr;
  db.transactions.push(txn);
  db.addAuditLog("ESCROW", req.user.userId, `Escrow vault locked ₹${amountInr.toLocaleString("en-IN")} for brief ${briefId}`);
  if (typeof db.save === "function") db.save();

  return res.status(201).json({
    success: true,
    transactionId: txn.id,
    milestoneId,
    lockedEscrowInr: amountInr,
    walletBalanceInr: user.balanceInr,
  });
});

// Release milestone escrow to creator
router.post("/escrow/release", requireAuth, requireRole("brand", "admin"), (req, res) => {
  const { briefId, creatorId, amountInr, milestoneId } = req.body;

  if (!briefId || !creatorId || !amountInr || !milestoneId) {
    return res.status(400).json({
      error: "Missing required fields: briefId, creatorId, amountInr, milestoneId",
      code: "VALIDATION_ERROR",
    });
  }

  // Verify a matching lock exists
  const lockTxn = db.transactions.find(
    (t) =>
      t.type === "escrow_lock" &&
      t.briefId === briefId &&
      t.creatorId === creatorId &&
      t.milestoneId === milestoneId &&
      t.status === "completed"
  );

  if (!lockTxn) {
    return res.status(404).json({
      error: "No matching escrow lock found for these parameters",
      code: "ESCROW_LOCK_NOT_FOUND",
    });
  }

  // Check for duplicate release
  const alreadyReleased = db.transactions.some(
    (t) =>
      t.type === "escrow_release" &&
      t.milestoneId === milestoneId &&
      t.status === "completed"
  );

  if (alreadyReleased) {
    return res.status(409).json({
      error: "Escrow for this milestone has already been released",
      code: "ESCROW_ALREADY_RELEASED",
    });
  }

  // Find creator's user account
  const creator = db.findCreatorById(creatorId);
  const creatorUser = db.users.find(
    (u) =>
      u.role === "creator" &&
      creator &&
      (u.company === creator.displayName || u.name === creator.displayName)
  );

  const txn = {
    id: `tx_${uuidv4().slice(0, 8)}`,
    userId: req.user.userId,
    type: "escrow_release",
    amountInr,
    campaign: lockTxn.campaign,
    creatorOrBrand: creator?.displayName || creatorId,
    status: "completed",
    date: new Date().toISOString(),
    method: "Escrow",
    briefId,
    creatorId,
    milestoneId,
  };

  // Credit creator's wallet
  if (creatorUser) {
    creatorUser.balanceInr += amountInr;
    // Also add a transaction on creator's side
    db.transactions.push({
      id: `tx_${uuidv4().slice(0, 8)}`,
      userId: creatorUser.id,
      type: "escrow_release",
      amountInr,
      campaign: lockTxn.campaign,
      creatorOrBrand: db.findUserById(req.user.userId)?.name || "Brand",
      status: "completed",
      date: new Date().toISOString(),
      method: "Escrow",
      briefId,
      creatorId,
      milestoneId,
    });
  }

  db.transactions.push(txn);
  db.addAuditLog("ESCROW", req.user.userId, `Escrow released ₹${amountInr.toLocaleString("en-IN")} to creator ${creatorId} for milestone ${milestoneId}`);
  if (typeof db.save === "function") db.save();

  return res.status(200).json({
    success: true,
    transactionId: txn.id,
    releasedAmountInr: amountInr,
    payoutStatus: "transferred_to_creator",
  });
});
