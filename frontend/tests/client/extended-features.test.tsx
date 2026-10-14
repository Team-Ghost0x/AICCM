import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  TakeScrubber,
  clampSplitBoundary,
  isInputElement,
} from "@/components/take-scrubber";
import {
  resetAudioStateForTesting,
  markUserInteracted,
  getAudioContext,
} from "@/lib/client/audio";
import { goldenCreators } from "@/lib/contract/fixtures";

describe("Option 2 Extended Features", () => {
  beforeEach(() => {
    resetAudioStateForTesting();
    vi.restoreAllMocks();
  });

  describe("A/B Split Slider Clamping", () => {
    it("clamps values below 0 to 0", () => {
      expect(clampSplitBoundary(-15)).toBe(0);
      expect(clampSplitBoundary(-0.01)).toBe(0);
    });

    it("clamps values above 100 to 100", () => {
      expect(clampSplitBoundary(105)).toBe(100);
      expect(clampSplitBoundary(999)).toBe(100);
    });

    it("preserves valid percentages between 0 and 100", () => {
      expect(clampSplitBoundary(0)).toBe(0);
      expect(clampSplitBoundary(42)).toBe(42);
      expect(clampSplitBoundary(50)).toBe(50);
      expect(clampSplitBoundary(100)).toBe(100);
    });

    it("handles NaN by falling back to 50", () => {
      expect(clampSplitBoundary(NaN)).toBe(50);
    });
  });

  describe("Keyboard Event Target Filtering", () => {
    it("identifies input, textarea, and select elements as input targets", () => {
      const input = document.createElement("input");
      const textarea = document.createElement("textarea");
      const select = document.createElement("select");
      const div = document.createElement("div");
      const button = document.createElement("button");

      expect(isInputElement(input)).toBe(true);
      expect(isInputElement(textarea)).toBe(true);
      expect(isInputElement(select)).toBe(true);
      expect(isInputElement(div)).toBe(false);
      expect(isInputElement(button)).toBe(false);
    });

    it("identifies contentEditable elements as input targets", () => {
      const editableDiv = document.createElement("div");
      Object.defineProperty(editableDiv, "isContentEditable", { value: true });
      expect(isInputElement(editableDiv)).toBe(true);
    });
  });

  describe("Studio Shortcuts J / K Navigation & Input Bypassing", () => {
    const heroPiece = goldenCreators[0].portfolio[0];

    it("steps through takes using J and K shortcuts when not typing", () => {
      render(<TakeScrubber piece={heroPiece} autoplay={false} />);
      const slider = screen.getByRole("slider");

      // Initial state is last take (index 4)
      expect(slider.getAttribute("aria-valuenow")).toBe("4");

      // Press 'J' to step to previous take (index 3)
      fireEvent.keyDown(window, { key: "j" });
      expect(slider.getAttribute("aria-valuenow")).toBe("3");

      // Press 'J' again (index 2)
      fireEvent.keyDown(window, { key: "j" });
      expect(slider.getAttribute("aria-valuenow")).toBe("2");

      // Press 'K' to step forward (index 3)
      fireEvent.keyDown(window, { key: "k" });
      expect(slider.getAttribute("aria-valuenow")).toBe("3");
    });

    it("ignores J and K shortcut events originating from input or textarea elements", () => {
      render(
        <div>
          <input data-testid="test-input" type="text" />
          <textarea data-testid="test-textarea" />
          <TakeScrubber piece={heroPiece} autoplay={false} />
        </div>
      );

      const slider = screen.getByRole("slider");
      const input = screen.getByTestId("test-input");
      const textarea = screen.getByTestId("test-textarea");

      // Current index starts at 4
      expect(slider.getAttribute("aria-valuenow")).toBe("4");

      // Typing 'j' inside an input element must NOT step the take
      fireEvent.keyDown(input, { key: "j" });
      expect(slider.getAttribute("aria-valuenow")).toBe("4");

      // Typing 'k' inside a textarea element must NOT step the take
      fireEvent.keyDown(textarea, { key: "k" });
      expect(slider.getAttribute("aria-valuenow")).toBe("4");
    });
  });

  describe("Lazy Web Audio Context Initialization", () => {
    it("does not construct AudioContext before user interaction", () => {
      expect(getAudioContext()).toBeNull();
    });

    it("allows AudioContext construction only after markUserInteracted", () => {
      markUserInteracted();
      const mockResume = vi.fn().mockResolvedValue(undefined);

      class MockAudioContext {
        state = "suspended";
        currentTime = 0;
        resume = mockResume;
        createOscillator = vi.fn().mockReturnValue({
          type: "triangle",
          frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        });
        createGain = vi.fn().mockReturnValue({
          gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn(),
        });
        destination = {};
      }

      window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

      const ctx = getAudioContext();
      expect(ctx).not.toBeNull();
    });
  });
});
