import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { GradientMedia } from "@/components/gradient-media";
import { CreatorStories } from "@/components/creator-stories";
import { OpenForWorkRail } from "@/components/open-for-work-rail";
import { TakeViewerModal } from "@/components/take-viewer-modal";
import { MobileSimulator } from "@/components/mobile-simulator";

describe("Figma Redesign Components & Color Palette", () => {
  it("renders GradientMedia with frosted perfume bottle and take label", () => {
    const { container } = render(
      <GradientMedia
        preset="aura"
        aspectRatio="4:5"
        showPerfumeBottle={true}
        takeLabel="Take 9 of 23"
      />
    );

    expect(screen.getByText("Take 9 of 23")).toBeDefined();
    expect(screen.getByText("Basalt")).toBeDefined();
    expect(screen.getByText(/Parfum/i)).toBeDefined();
    expect(container.querySelector(".bg-aura-gradient")).toBeDefined();
  });

  it("renders CreatorStories with vibrant gradient ring creators", () => {
    render(<CreatorStories />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders OpenForWorkRail with creators and invite buttons", () => {
    render(<OpenForWorkRail />);
    expect(screen.getByText(/Open for work/i)).toBeDefined();
    const inviteButtons = screen.getAllByRole("button", { name: /Invite/i });
    expect(inviteButtons.length).toBeGreaterThan(0);
  });

  it("renders TakeViewerModal with interactive scrubber and prompt telemetry", () => {
    render(
      <TakeViewerModal
        isOpen={true}
        onClose={() => {}}
        initialTake={9}
        totalTakes={23}
      />
    );

    const takeMatches = screen.getAllByText(/Take 9 of 23/i);
    expect(takeMatches.length).toBeGreaterThan(0);
    expect(screen.getByText(/Cleared for commercial use/i)).toBeDefined();
    expect(screen.getByText(/What changed:/i)).toBeDefined();
    expect(screen.getByRole("slider")).toBeDefined();

    // Verify key take buttons exist with exact take names
    expect(screen.getByRole("button", { name: /^Take 1$/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^Take 4$/i })).toBeDefined();
  });

  it("renders MobileSimulator and toggles preview views", () => {
    render(<MobileSimulator />);

    const openButton = screen.getByRole("button", {
      name: /Open Mobile App Simulator/i,
    });
    expect(openButton).toBeDefined();

    // Open simulator modal
    fireEvent.click(openButton);

    // Verify screen tabs
    expect(screen.getByRole("button", { name: "Feed" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Discover" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Profile" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Viewer" })).toBeDefined();

    // Switch to Discover tab
    const discoverBtn = screen.getByRole("button", { name: "Discover" });
    fireEvent.click(discoverBtn);
    expect(screen.getByText(/Closest to what you asked for/i)).toBeDefined();

    // Switch to Profile tab
    const profileBtn = screen.getByRole("button", { name: "Profile" });
    fireEvent.click(profileBtn);
    expect(screen.getByText(/pieces/i)).toBeDefined();
    expect(screen.getByText(/turnaround/i)).toBeDefined();

    // Switch to Viewer tab
    const viewerBtn = screen.getByRole("button", { name: "Viewer" });
    fireEvent.click(viewerBtn);
    expect(screen.getByText(/What changed:/i)).toBeDefined();
  });
});
