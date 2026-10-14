import { describe, it, expect } from "vitest";
import { generateRightsSummary } from "@/lib/contract/rights";
import { CommercialUse } from "@/lib/contract/schemas";

describe("Rights Matrix Summary Generation", () => {
  it("formats commercial rights summary in plain human language", () => {
    const terms: CommercialUse = {
      uses: ["paid_social", "website"],
      territory: "india",
      termMonths: 12,
      exclusivity: "none",
      rightsTransfer: "license",
      aiDisclosure: "must_label",
      noModelTraining: true,
    };

    const summary = generateRightsSummary(terms);
    expect(summary).toContain("paid social and website");
    expect(summary).toContain("India");
    expect(summary).toContain("12 months");
    expect(summary).toContain("non-exclusive licence");
    expect(summary).toContain("no model training");
  });
});
