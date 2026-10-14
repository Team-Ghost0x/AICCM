import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AdminPinGate } from "@/components/admin-pin-gate";
import { getCurrentUser, switchRole, saveCurrentUser, User } from "@/lib/client/auth";
import { sanitizeTextInput } from "@/lib/contract/schemas";

describe("Double Security Scan: Authentication, PIN Gate & Data Hygiene", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  // Admin PIN Gate access control tests
  describe("Scan 1: Admin Passcode '0000' & Access Control Gate", () => {
    it("blocks access to protected admin children when locked", () => {
      render(
        <AdminPinGate>
          <div data-testid="admin-sensitive-data">TOP SECRET ESCROW CONTROLS</div>
        </AdminPinGate>
      );

      // Sensitive content must NOT be visible
      expect(screen.queryByTestId("admin-sensitive-data")).toBeNull();
      // Lock screen must be displayed
      expect(screen.getByText("Admin Access Gate")).toBeDefined();
    });

    it("rejects invalid passcodes and shows error feedback", () => {
      render(
        <AdminPinGate>
          <div data-testid="admin-sensitive-data">TOP SECRET ESCROW CONTROLS</div>
        </AdminPinGate>
      );

      // Enter wrong PIN: 1234
      fireEvent.click(screen.getByRole("button", { name: "1" }));
      fireEvent.click(screen.getByRole("button", { name: "2" }));
      fireEvent.click(screen.getByRole("button", { name: "3" }));
      fireEvent.click(screen.getByRole("button", { name: "4" }));

      // Must remain locked and display error
      expect(screen.queryByTestId("admin-sensitive-data")).toBeNull();
      expect(screen.getByText(/Invalid passcode/i)).toBeDefined();
    });

    it("unlocks access immediately when passcode '0000' is entered", () => {
      render(
        <AdminPinGate>
          <div data-testid="admin-sensitive-data">TOP SECRET ESCROW CONTROLS</div>
        </AdminPinGate>
      );

      // Enter correct PIN: 0000
      const zeroButton = screen.getByRole("button", { name: "0" });
      fireEvent.click(zeroButton);
      fireEvent.click(zeroButton);
      fireEvent.click(zeroButton);
      fireEvent.click(zeroButton);

      // Admin content must now be revealed
      expect(screen.getByTestId("admin-sensitive-data")).toBeDefined();
      expect(screen.getByText("Lock Admin Panel")).toBeDefined();
    });

    it("triggers brute-force lockout after 5 consecutive failed attempts", () => {
      render(
        <AdminPinGate>
          <div data-testid="admin-sensitive-data">TOP SECRET ESCROW CONTROLS</div>
        </AdminPinGate>
      );

      const oneButton = screen.getByRole("button", { name: "1" });

      // Attempt 1 to 5 with wrong PINs
      for (let attempt = 0; attempt < 5; attempt++) {
        fireEvent.click(oneButton);
        fireEvent.click(oneButton);
        fireEvent.click(oneButton);
        fireEvent.click(oneButton);
      }

      // Lockout message must trigger
      expect(screen.getByText(/Locked for 30s/i)).toBeDefined();
      expect(screen.queryByTestId("admin-sensitive-data")).toBeNull();
    });

    it("allows locking the session to immediately re-gate the admin panel", () => {
      // Pre-seed unlocked session
      sessionStorage.setItem("retake_admin_session_unlocked", "true");

      render(
        <AdminPinGate>
          <div data-testid="admin-sensitive-data">TOP SECRET ESCROW CONTROLS</div>
        </AdminPinGate>
      );

      // Initially unlocked
      expect(screen.getByTestId("admin-sensitive-data")).toBeDefined();

      // Click lock button
      const lockButton = screen.getByRole("button", { name: /Lock Admin Panel/i });
      fireEvent.click(lockButton);

      // Must immediately revert to locked state
      expect(screen.queryByTestId("admin-sensitive-data")).toBeNull();
      expect(screen.getByText("Admin Access Gate")).toBeDefined();
    });
  });

  // Input sanitization and data validation tests
  describe("Scan 2: Input Sanitization, XSS Mitigation & Persona Integrity", () => {
    it("sanitizes malicious script tags and HTML injection vectors", () => {
      const maliciousScript = "<script>alert('XSS')</script>Hello World";
      const sanitized = sanitizeTextInput(maliciousScript);

      // Must strip out script tags
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("</script>");
      expect(sanitized).toContain("Hello World");
    });

    it("sanitizes dangerous onerror and onload event handlers", () => {
      const maliciousImg = '<img src="x" onerror="alert(1)">Director Profile';
      const sanitized = sanitizeTextInput(maliciousImg);

      expect(sanitized).not.toContain("onerror");
      expect(sanitized).toContain("Director Profile");
    });

    it("protects user session state and validates role switching invariants", () => {
      const testUser: User = {
        id: "creator-mira",
        name: "Mira Okonkwo",
        email: "mira.okonkwo@retake.market",
        role: "creator",
        balanceInr: 150000,
        credits: 100,
        provider: "google",
      };

      saveCurrentUser(testUser);
      const retrieved = getCurrentUser();
      expect(retrieved?.id).toBe("creator-mira");
      expect(retrieved?.role).toBe("creator");

      // Switch role securely
      const brandUser = switchRole("brand");
      expect(brandUser.role).toBe("brand");
      expect(brandUser.id).toBe("client-vikram");
    });
  });
});
