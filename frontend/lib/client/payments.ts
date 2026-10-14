"use client";

import { addFunds, deductFunds } from "./auth";

export interface Transaction {
  id: string;
  type: "deposit" | "escrow_lock" | "escrow_release" | "payout";
  amountInr: number;
  campaign: string;
  creatorOrBrand: string;
  status: "completed" | "processing";
  date: string;
  method: "UPI" | "Card" | "Escrow";
}

const STORAGE_KEY = "retake_transactions_v1";

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-2026-881",
    type: "escrow_lock",
    amountInr: 95000,
    campaign: "NEO-SHINJUKU 2099 Cyberpunk Teaser",
    creatorOrBrand: "Mira Okonkwo",
    status: "completed",
    date: "13 Oct 2026",
    method: "Escrow",
  },
  {
    id: "tx-2026-879",
    type: "deposit",
    amountInr: 150000,
    campaign: "Acme Working Capital",
    creatorOrBrand: "Acme Studios",
    status: "completed",
    date: "12 Oct 2026",
    method: "UPI",
  },
  {
    id: "tx-2026-865",
    type: "escrow_release",
    amountInr: 45000,
    campaign: "Aura perfume bottle",
    creatorOrBrand: "Dev Sen",
    status: "completed",
    date: "10 Oct 2026",
    method: "Escrow",
  },
];

export function getTransactions(): Transaction[] {
  if (typeof window === "undefined") return DEFAULT_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TRANSACTIONS));
      return DEFAULT_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TRANSACTIONS;
  }
}

export function saveTransactions(txs: Transaction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
  } catch {
    // Ignore storage errors
  }
}

export function createDeposit(amountInr: number, method: "UPI" | "Card"): Transaction {
  const tx: Transaction = {
    id: `tx-dep-${Date.now()}`,
    type: "deposit",
    amountInr,
    campaign: "Wallet Deposit",
    creatorOrBrand: "Studio Wallet",
    status: "completed",
    date: "13 Oct 2026",
    method,
  };

  const current = getTransactions();
  const updated = [tx, ...current];
  saveTransactions(updated);
  addFunds(amountInr);
  return tx;
}

export function releaseMilestonePayout(
  campaign: string,
  creator: string,
  amountInr: number
): Transaction {
  const tx: Transaction = {
    id: `tx-rel-${Date.now()}`,
    type: "escrow_release",
    amountInr,
    campaign,
    creatorOrBrand: creator,
    status: "completed",
    date: "13 Oct 2026",
    method: "Escrow",
  };

  const current = getTransactions();
  const updated = [tx, ...current];
  saveTransactions(updated);
  deductFunds(amountInr);
  return tx;
}
