import { describe, it, expect } from "vitest";
import { BriefSchema, EngagementSchema } from "@/lib/contract/schemas";
import { parseBriefDraft } from "@/lib/mocks/draft-brief";

// Exported/internal security function reproduction for verification
function isSafeMediaUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("/media/")) {
    return !trimmed.includes("..") && !trimmed.includes("<") && !trimmed.includes(">");
  }
  if (trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === "https:" && Boolean(parsed.hostname);
    } catch {
      return false;
    }
  }
  return false;
}

describe("Security & Input Sanitization Suite", () => {
  describe("MediaFrame URL Validation", () => {
    it("allows valid local media assets", () => {
      expect(isSafeMediaUrl("/media/hero/take-1.jpg")).toBe(true);
      expect(isSafeMediaUrl("/media/pieces/piece-2.jpg")).toBe(true);
    });

    it("allows valid https external media assets", () => {
      expect(isSafeMediaUrl("https://cdn.retake.market/assets/take-9.jpg")).toBe(true);
    });

    it("blocks directory traversal attempts in media URLs", () => {
      expect(isSafeMediaUrl("/media/../../etc/passwd")).toBe(false);
      expect(isSafeMediaUrl("/media/../private/key.pem")).toBe(false);
    });

    it("blocks javascript: and dangerous pseudo-protocols", () => {
      expect(isSafeMediaUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeMediaUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeMediaUrl("file:///etc/hosts")).toBe(false);
      expect(isSafeMediaUrl("vbscript:msgbox(1)")).toBe(false);
    });

    it("blocks HTML tag injections in media URLs", () => {
      expect(isSafeMediaUrl("/media/<script>alert(1)</script>")).toBe(false);
      expect(isSafeMediaUrl("/media/img.jpg?foo=<h1>test</h1>")).toBe(false);
    });

    it("blocks malformed https strings", () => {
      expect(isSafeMediaUrl("https://")).toBe(false);
      expect(isSafeMediaUrl("https://:invalid-host")).toBe(false);
    });
  });

  describe("Contract Validation Bounds (Zod Schema Hardening)", () => {
    it("validates well-formed brief objects", () => {
      const validBrief = {
        id: "brief-valid-101",
        brandName: "Acme Perfumes",
        title: "Rain Collection 2026",
        objective: "Atmospheric teaser for luxury perfume in rain",
        requirements: "Macro droplets on crystal glass, warm sunset tone",
        contentType: "video" as const,
        styleTags: ["cinematic", "macro"],
        referenceUrls: ["https://example.com/ref1.jpg"],
        formats: [{ aspectRatio: "9:16" as const, durationSec: 15 }],
        preferredTools: ["Runway Gen-3", "ComfyUI"],
        budgetInr: { min: 60000, max: 120000 },
        deadline: "2026-11-15T00:00:00.000Z",
        deliverablesCount: 3,
        commercialUse: {
          uses: ["paid_social" as const, "organic_social" as const],
          territory: "global" as const,
          termMonths: 12,
          exclusivity: "none" as const,
          rightsTransfer: "license" as const,
          aiDisclosure: "must_label" as const,
          noModelTraining: true,
        },
        status: "open" as const,
        createdAt: "2026-10-13T08:00:00.000Z",
      };

      const result = BriefSchema.safeParse(validBrief);
      expect(result.success).toBe(true);
    });

    it("rejects briefs with invalid deliverablesCount (non-positive)", () => {
      const invalidBrief = {
        id: "brief-invalid",
        brandName: "Test",
        title: "Test",
        objective: "Test objective",
        requirements: "Test requirements",
        contentType: "video" as const,
        styleTags: [],
        referenceUrls: [],
        formats: [{ aspectRatio: "9:16" as const }],
        preferredTools: [],
        deliverablesCount: -1, // invalid non-positive
        commercialUse: {
          uses: ["organic_social" as const],
          territory: "india" as const,
          termMonths: 6,
          exclusivity: "none" as const,
          rightsTransfer: "license" as const,
          aiDisclosure: "must_label" as const,
          noModelTraining: true,
        },
        status: "draft" as const,
        createdAt: "2026-10-13T08:00:00.000Z",
      };

      const result = BriefSchema.safeParse(invalidBrief);
      expect(result.success).toBe(false);
    });

    it("validates engagement pipeline milestones schema", () => {
      const validEngagement = {
        id: "eng-monsoon-01",
        briefId: "brief-monsoon",
        creatorId: "creator-mira",
        stage: "review" as const,
        takes: [
          {
            n: 9,
            note: "Added rim light, mist droplets.",
            mediaUrl: "/media/hero/take-3.jpg",
            status: "approved" as const,
          },
          {
            n: 17,
            note: "Cool highlights on glass edges.",
            mediaUrl: "/media/hero/take-4.jpg",
            status: "submitted" as const,
          },
        ],
      };

      const result = EngagementSchema.safeParse(validEngagement);
      expect(result.success).toBe(true);
    });
  });

  describe("Rough Idea AI Draft Parser Safety", () => {
    it("safely handles XSS payloads and script tags in idea prompt", () => {
      const maliciousPrompt = "<script>alert('pwned')</script> Need 3 luxury perfume videos in vertical 9:16 with 120000 budget";
      const draft = parseBriefDraft(maliciousPrompt);

      expect(draft.brief.formats?.[0]?.aspectRatio).toBe("9:16");
      expect(draft.brief.requirements).toContain("<script>");
      // Returns safely structured data without throwing
      expect(draft.source).toBe("rules");
    });

    it("detects missing gaps safely when prompt is minimal", () => {
      const minimalPrompt = "Need cool AI video";
      const draft = parseBriefDraft(minimalPrompt);

      expect(draft.gaps.length).toBeGreaterThan(0);
      expect(draft.gaps.some((g) => g.field === "budget" || g.field === "formats")).toBe(true);
    });
  });
});
