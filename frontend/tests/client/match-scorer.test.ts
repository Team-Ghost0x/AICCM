import { describe, it, expect } from "vitest";
import { rankCreatorsForBrief } from "@/lib/mocks/match-scorer";
import { goldenBrief, goldenCreators } from "@/lib/contract/fixtures";

describe("Match Scorer Engine", () => {
  it("ranks Mira first with Runway and 4-day turnaround reasons", () => {
    const fixedDate = new Date();
    const ranked = rankCreatorsForBrief(goldenBrief, goldenCreators, fixedDate);

    expect(ranked[0].creator.id).toBe("creator-mira");
    const miraReasons = ranked[0].reasons.join(" ");
    expect(miraReasons.toLowerCase()).toContain("runway");
    expect(miraReasons.toLowerCase()).toContain("4 days");
    expect(miraReasons.toLowerCase()).toContain("4:5");
  });

  it("ranks Sofia last due to no format overlap and booked status", () => {
    const ranked = rankCreatorsForBrief(goldenBrief, goldenCreators);
    const last = ranked[ranked.length - 1];
    expect(last.creator.id).toBe("creator-sofia");
  });

  it("does NOT claim a budget fit for Dev (rate ₹90k over ₹40k max)", () => {
    const ranked = rankCreatorsForBrief(goldenBrief, goldenCreators);
    const devMatch = ranked.find((m) => m.creator.id === "creator-dev");
    expect(devMatch).toBeDefined();
    const devReasons = devMatch?.reasons.join(" ") || "";
    expect(devReasons.toLowerCase()).not.toContain("fits your");
  });
});
