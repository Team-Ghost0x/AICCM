import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TakeScrubber } from "@/components/take-scrubber";
import { goldenCreators } from "@/lib/contract/fixtures";

describe("TakeScrubber Component", () => {
  const heroPiece = goldenCreators[0].portfolio[0];

  it("renders native range input with correct aria-valuetext", () => {
    render(<TakeScrubber piece={heroPiece} autoplay={false} />);

    const slider = screen.getByRole("slider");
    expect(slider).toBeDefined();

    // Last take is index 4 (take 23)
    expect(slider.getAttribute("aria-valuemax")).toBe("4");
    expect(slider.getAttribute("aria-valuenow")).toBe("4");
    expect(slider.getAttribute("aria-valuetext")).toContain("Take 23");
  });

  it("updates take when range input value changes", () => {
    render(<TakeScrubber piece={heroPiece} autoplay={false} />);

    const slider = screen.getByRole("slider");
    // Change to take index 0 (Take 1)
    fireEvent.change(slider, { target: { value: "0" } });

    expect(slider.getAttribute("aria-valuenow")).toBe("0");
    expect(screen.getByText(/Take 1 of 23/i)).toBeDefined();
    expect(screen.getByText(/Initial megalopolis worldbuilding/i)).toBeDefined();
  });

  it("degrades gracefully to static final frame when piece has no key takes", () => {
    const pieceWithoutTakes = {
      ...heroPiece,
      keyTakes: [],
    };

    render(<TakeScrubber piece={pieceWithoutTakes} />);
    expect(screen.queryByRole("slider")).toBeNull();
    expect(
      screen.getByText(/The creator hasn't shared individual takes for this piece/i)
    ).toBeDefined();
  });
});
