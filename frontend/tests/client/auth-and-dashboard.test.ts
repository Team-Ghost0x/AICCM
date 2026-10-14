import { describe, it, expect, beforeEach } from "vitest";
import {
  getCurrentUser,
  loginWithGoogle,
  loginWithEmail,
  logout,
  switchRole,
} from "@/lib/client/auth";
import {
  getTransactions,
  createDeposit,
  releaseMilestonePayout,
} from "@/lib/client/payments";

describe("Auth, Dashboard & Payments Suite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Authentication Module", () => {
    it("returns null on initial load when not logged in", () => {
      const user = getCurrentUser();
      expect(user).toBeNull();
    });

    it("logs in with Google and switches role", () => {
      const creator = loginWithGoogle("creator");
      expect(creator.provider).toBe("google");
      expect(creator.role).toBe("creator");
      expect(creator.name).toBe("Arjun Patel");

      const stored = getCurrentUser();
      expect(stored?.id).toBe(creator.id);
    });

    it("logs in with custom email address", () => {
      const customUser = loginWithEmail("director@studio.ai", "Director Lin");
      expect(customUser.provider).toBe("email");
      expect(customUser.email).toBe("director@studio.ai");
      expect(customUser.name).toBe("Director Lin");
    });

    it("switches role dynamically", () => {
      loginWithGoogle("brand");
      const switched = switchRole("creator");
      expect(switched.role).toBe("creator");
      expect(switched.email).toContain("arjun");
    });

    it("clears user on logout", () => {
      loginWithGoogle("brand");
      logout();
      // On empty localStorage, default is recovered on next call or null
      expect(localStorage.getItem("retake_auth_user_v2")).toBeNull();
    });
  });

  describe("Wallet & Payment System", () => {
    it("adds funds to user balance and records deposit transaction", () => {
      const user = loginWithGoogle("brand");
      const initialBalance = user.balanceInr;

      const tx = createDeposit(50000, "UPI");
      expect(tx.type).toBe("deposit");
      expect(tx.amountInr).toBe(50000);
      expect(tx.method).toBe("UPI");

      const updatedUser = getCurrentUser();
      expect(updatedUser?.balanceInr).toBe(initialBalance + 50000);

      const allTx = getTransactions();
      expect(allTx.some((t) => t.id === tx.id)).toBe(true);
    });

    it("releases milestone payout and deducts from escrow", () => {
      const user = loginWithGoogle("brand");
      const initialBalance = user.balanceInr;

      const tx = releaseMilestonePayout("NEO-SHINJUKU 2099 Cyberpunk Teaser", "Mira Okonkwo", 45000);
      expect(tx.type).toBe("escrow_release");
      expect(tx.amountInr).toBe(45000);

      const updatedUser = getCurrentUser();
      expect(updatedUser?.balanceInr).toBe(initialBalance - 45000);
    });
  });
});
