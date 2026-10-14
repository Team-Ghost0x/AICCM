import { describe, it, expect } from "vitest";
import { executeSearch } from "@/lib/mocks/search";
import { goldenCreators } from "@/lib/contract/fixtures";

describe("Search Engine & Scenarios (S1-S6)", () => {
  it("S1: tool=runway matches mira and sofia", () => {
    const res = executeSearch(goldenCreators, { tool: ["runway"] });
    expect(res.total).toBe(2);
    const ids = res.items.map((c) => c.id);
    expect(ids).toContain("creator-mira");
    expect(ids).toContain("creator-sofia");
  });

  it("S2: tool=runway,kling (OR inside facet) matches mira, arjun, sofia", () => {
    const res = executeSearch(goldenCreators, { tool: ["runway", "kling"] });
    expect(res.total).toBe(3);
    const ids = res.items.map((c) => c.id);
    expect(ids).toContain("creator-mira");
    expect(ids).toContain("creator-arjun");
    expect(ids).toContain("creator-sofia");
  });

  it("S3: tool=runway&format=9:16 returns 0 matches and two relaxations", () => {
    const res = executeSearch(goldenCreators, {
      tool: ["runway"],
      format: ["9:16"],
    });
    expect(res.total).toBe(0);
    expect(res.relaxations.length).toBe(2);
    expect(res.relaxations[0].wouldReturn).toBe(2);
    expect(res.relaxations[1].wouldReturn).toBe(2);
  });

  it("S4: tool=midjourney&availability=open matches mira and dev", () => {
    const res = executeSearch(goldenCreators, {
      tool: ["midjourney"],
      availability: "open",
    });
    expect(res.total).toBe(2);
    const ids = res.items.map((c) => c.id);
    expect(ids).toContain("creator-mira");
    expect(ids).toContain("creator-dev");
  });

  it("S5: tool=midjourney&availability=open&maxPriceInr=20000 returns 0 and 1 relaxation", () => {
    const res = executeSearch(goldenCreators, {
      tool: ["midjourney"],
      availability: "open",
      maxPriceInr: 20000,
    });
    expect(res.total).toBe(0);
    expect(res.relaxations.length).toBe(1);
    expect(res.relaxations[0].filter).toBe("maxPriceInr");
    expect(res.relaxations[0].wouldReturn).toBe(2);
  });

  it("S6: q=kling matches tool names (mira and arjun)", () => {
    const res = executeSearch(goldenCreators, { q: "kling" });
    expect(res.total).toBe(2);
    const ids = res.items.map((c) => c.id);
    expect(ids).toContain("creator-mira");
    expect(ids).toContain("creator-arjun");
  });
});
