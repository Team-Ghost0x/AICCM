import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  playDirectionalTick,
  playTakeTick,
  playSuccessChime,
  playThemeSound,
  resetAudioStateForTesting,
} from "@/lib/client/audio";
import { RightsMatrix } from "@/components/rights-matrix";
import { RightsCertificateModal } from "@/components/rights-certificate-modal";
import DirectorStudioPage from "@/app/studio/page";
import { CommercialUse } from "@/lib/contract/schemas";

const MOCK_COMMERCIAL_USE: CommercialUse = {
  uses: ["paid_social", "website"],
  territory: "global",
  termMonths: 12,
  exclusivity: "category",
  rightsTransfer: "license",
  aiDisclosure: "creator_discretion",
  noModelTraining: true,
};

describe("Director Studio & Audio Sensory Suite", () => {
  beforeEach(() => {
    resetAudioStateForTesting();
  });

  it("handles directional audio ticks and pitch calculations safely", () => {
    expect(() => playDirectionalTick("forward")).not.toThrow();
    expect(() => playDirectionalTick("backward")).not.toThrow();
    expect(() => playDirectionalTick(1)).not.toThrow();
    expect(() => playDirectionalTick(-1)).not.toThrow();
    expect(() => playSuccessChime()).not.toThrow();
    expect(() => playThemeSound("dark")).not.toThrow();
    expect(() => playThemeSound("light")).not.toThrow();
  });

  it("renders RightsMatrix with Generate Certificate button and opens modal", () => {
    const handleChange = vi.fn();
    render(<RightsMatrix value={MOCK_COMMERCIAL_USE} onChange={handleChange} />);

    // Generate Certificate button should be visible
    const certBtn = screen.getByRole("button", { name: /generate certificate/i });
    expect(certBtn).toBeDefined();

    // Clicking it should trigger modal
    fireEvent.click(certBtn);
    expect(screen.getByText(/AI Commercial Clearance Certificate/i)).toBeDefined();
  });

  it("renders RightsCertificateModal with verified warranty terms and export actions", () => {
    const handleClose = vi.fn();
    render(
      <RightsCertificateModal
        isOpen={true}
        onClose={handleClose}
        commercialUse={MOCK_COMMERCIAL_USE}
        campaignTitle="Cyberpunk Test Campaign"
        brandName="Apex Media"
      />
    );

    expect(screen.getByText(/AI Commercial Clearance Certificate/i)).toBeDefined();
    expect(screen.getByText(/Cyberpunk Test Campaign/i)).toBeDefined();
    expect(screen.getByText(/Guaranteed \(Prohibited\)/i)).toBeDefined();

    const copyBtn = screen.getByRole("button", { name: /copy hash/i });
    expect(copyBtn).toBeDefined();

    const downloadBtn = screen.getByRole("button", { name: /download spec/i });
    expect(downloadBtn).toBeDefined();
  });

  it("renders Director Studio page with telemetry, tabs, and interactive sections", () => {
    render(<DirectorStudioPage />);

    expect(screen.getByText(/Director Studio/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /take scrubber & reel/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /node pipeline graph/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /rights clearance matrix/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /sensory audio lab/i })).toBeDefined();

    // Switch to Sensory Audio Lab tab
    const audioTab = screen.getByRole("button", { name: /sensory audio lab/i });
    fireEvent.click(audioTab);
    expect(screen.getByText(/Web Audio Sensory Feedback Synthesizer/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /play forward tick/i })).toBeDefined();

    // Switch to Node Pipeline Graph tab
    const pipelineTab = screen.getByRole("button", { name: /node pipeline graph/i });
    fireEvent.click(pipelineTab);
    expect(screen.getByText(/ComfyUI & Neural Pipeline Topology/i)).toBeDefined();
  });
});
