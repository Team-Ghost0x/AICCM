"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { PortfolioPiece, Take } from "@/lib/contract/schemas";
import { MediaFrame } from "./media-frame";
import { playTakeTick, playDirectionalTick, markUserInteracted } from "@/lib/client/audio";
import { TakeViewerModal } from "./take-viewer-modal";

interface TakeScrubberProps {
  piece: PortfolioPiece;
  autoplay?: boolean;
}

export function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toUpperCase();
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable === true
  );
}

export function clampSplitBoundary(value: number): number {
  if (Number.isNaN(value)) return 50;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function TakeScrubber({ piece, autoplay = false }: TakeScrubberProps) {
  const takes: Take[] = useMemo(() => piece.keyTakes || [], [piece.keyTakes]);
  const hasMultipleTakes = takes.length >= 2;
  const lastIndex = hasMultipleTakes ? takes.length - 1 : 0;

  // Reduced motion detection
  const prefersReducedMotion =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const [currentIndex, setCurrentIndex] = useState(
    autoplay && !prefersReducedMotion ? 0 : lastIndex
  );
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const [showLightbox, setShowLightbox] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userInteractedRef = useRef(false);

  // Autoplay once on Home page: step through takes over 2.5s and stop at final
  useEffect(() => {
    if (!autoplay || prefersReducedMotion || !hasMultipleTakes) return;

    const stepIntervalMs = Math.max(350, Math.floor(2500 / takes.length));
    let step = 0;

    const interval = setInterval(() => {
      if (userInteractedRef.current) {
        clearInterval(interval);
        return;
      }
      step++;
      if (step < takes.length) {
        setCurrentIndex(step);
      } else {
        clearInterval(interval);
      }
    }, stepIntervalMs);

    autoplayTimerRef.current = interval;

    return () => clearInterval(interval);
  }, [autoplay, hasMultipleTakes, prefersReducedMotion, takes.length]);

  // Preload all take images upfront for instantaneous 60fps scrubbing
  useEffect(() => {
    if (!hasMultipleTakes) return;
    takes.forEach((t: Take) => {
      if (t.imageUrl) {
        const img = new Image();
        img.src = t.imageUrl;
      }
    });
  }, [hasMultipleTakes, takes]);

  // Studio keyboard shortcuts: J (previous take), K (next take)
  useEffect(() => {
    if (!hasMultipleTakes) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputElement(e.target)) return;

      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        userInteractedRef.current = true;
        markUserInteracted();
        setCurrentIndex((prev) => {
          const nextIdx = Math.max(0, prev - 1);
          if (nextIdx !== prev) {
            playDirectionalTick("backward");
          }
          return nextIdx;
        });
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        userInteractedRef.current = true;
        markUserInteracted();
        setCurrentIndex((prev) => {
          const nextIdx = Math.min(lastIndex, prev + 1);
          if (nextIdx !== prev) {
            playDirectionalTick("forward");
          }
          return nextIdx;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMultipleTakes, lastIndex]);

  const handleSliderChange = useCallback(
    (newIndex: number) => {
      userInteractedRef.current = true;
      markUserInteracted();
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
      if (newIndex !== currentIndex) {
        const direction = newIndex > currentIndex ? "forward" : "backward";
        playDirectionalTick(direction);
        setCurrentIndex(newIndex);
      }
    },
    [currentIndex]
  );

  // When piece has fewer than 2 key takes, degrade gracefully
  if (!hasMultipleTakes) {
    return (
      <figure className="w-full m-0 p-0 text-left">
        <MediaFrame
          src={piece.mediaUrl}
          ratio={piece.aspectRatio}
          alt={piece.title}
        />
        <figcaption className="mt-3 text-sm text-[var(--muted)]">
          The creator hasn&apos;t shared individual takes for this piece.
        </figcaption>
      </figure>
    );
  }

  const currentTake: Take = takes[currentIndex];
  const finalTake: Take = takes[lastIndex];
  const isFinal = currentIndex === lastIndex;
  const clampedSplit = clampSplitBoundary(splitPosition);

  return (
    <figure className="w-full m-0 p-0 text-left select-none">
      {/* Visual Frame */}
      {splitMode && !isFinal ? (
        <div className={`flex flex-col gap-2 ${piece.aspectRatio === "9:16" ? "max-w-[360px] mx-auto w-full" : "w-full"}`}>
          {/* Interactive Clamped Split Comparison Canvas */}
          <div className="relative w-full overflow-hidden bg-[#000000] border border-[var(--border)] rounded-xl shadow-sm">
            {/* Background Layer: Final Take */}
            <MediaFrame
              src={finalTake.imageUrl}
              ratio={piece.aspectRatio}
              alt={`Final take ${finalTake.n}`}
              takeNumber={finalTake.n}
            />

            {/* Overlaid Clipped Layer: Current Take */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                clipPath: `polygon(0 0, ${clampedSplit}% 0, ${clampedSplit}% 100%, 0 100%)`,
              }}
            >
              <MediaFrame
                src={currentTake.imageUrl}
                ratio={piece.aspectRatio}
                alt={`Take ${currentTake.n}`}
                takeNumber={currentTake.n}
                className="w-full h-full"
              />
            </div>

            {/* Clamped Split divider line */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-[var(--link-aa)] pointer-events-none shadow-[0_0_8px_rgba(0,149,246,0.6)]"
              style={{ left: `${clampedSplit}%` }}
            />

            {/* Tags */}
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs border border-white/20 text-white text-[11px] px-2.5 py-1 font-semibold rounded-full shadow-xs">
              Take {currentTake.n}
            </div>
            <div className="absolute top-3 right-3 bg-[var(--link-aa)] text-white text-[11px] px-2.5 py-1 font-bold rounded-full shadow-xs">
              Final Master
            </div>
          </div>

          {/* Draggable/Range Split Position Slider */}
          <div className="flex items-center justify-between gap-3 text-xs bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border)] shadow-xs">
            <div className="flex items-center gap-2">
              <label
                htmlFor={`split-range-${piece.id}`}
                className="text-[var(--text)] whitespace-nowrap text-xs font-bold"
              >
                Split: {clampedSplit}%
              </label>
              <button
                type="button"
                onClick={() => setSplitPosition(50)}
                className="text-[11px] px-2 py-0.5 bg-[var(--bg)] text-[var(--text-secondary-aa)] hover:text-[var(--text)] border border-[var(--border)] rounded font-medium"
              >
                50:50
              </button>
            </div>
            <input
              id={`split-range-${piece.id}`}
              type="range"
              min={0}
              max={100}
              value={splitPosition}
              onChange={(e) =>
                setSplitPosition(clampSplitBoundary(Number(e.target.value)))
              }
              className="flex-1 max-w-[280px]"
            />
          </div>
        </div>
      ) : (
        <div className={`relative ${piece.aspectRatio === "9:16" ? "max-w-[360px] mx-auto w-full" : "w-full"}`}>
          <MediaFrame
            src={currentTake.imageUrl}
            ratio={piece.aspectRatio}
            alt={`${piece.title}, take ${currentTake.n}`}
            takeNumber={currentTake.n}
            showHud={false}
          />
          {isFinal && (
            <div className="absolute top-3 right-3 bg-[var(--link-aa)] text-white text-xs px-3 py-1 font-bold rounded-full shadow-md">
              Final Master
            </div>
          )}
        </div>
      )}

      {/* Native range input slider */}
      <div className="mt-3">
        <label htmlFor={`scrubber-${piece.id}`} className="sr-only">
          Scrub through generation takes for {piece.title}
        </label>
        <input
          id={`scrubber-${piece.id}`}
          type="range"
          min={0}
          max={lastIndex}
          value={currentIndex}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          aria-valuemin={0}
          aria-valuemax={lastIndex}
          aria-valuenow={currentIndex}
          aria-valuetext={`Take ${currentTake.n} of ${piece.takesCount}: ${currentTake.whatChanged}`}
          className="w-full"
        />

        {/* Tick labels with responsive tactile pills */}
        <div className="flex justify-between items-center text-xs text-[var(--text-secondary-aa)] mt-1.5 tabular-numbers font-medium">
          {takes.map((t, idx) => (
            <button
              key={t.n}
              type="button"
              onClick={() => handleSliderChange(idx)}
              className={`cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                idx === currentIndex
                  ? "bg-[var(--text)] text-[var(--surface)] font-bold shadow-xs scale-105"
                  : "bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary-aa)] hover:text-[var(--text)]"
              }`}
            >
              {idx === lastIndex ? "Final" : `Take ${t.n}`}
            </button>
          ))}
        </div>
      </div>

      {/* Metadata & Take Details */}
      <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[var(--text)] tabular-numbers flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--link-aa)] inline-block" />
            <span>Take {currentTake.n} of {piece.takesCount} · {currentTake.tool}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline text-[11px] text-[var(--text-secondary-aa)] font-medium bg-[var(--bg)] px-2 py-0.5 rounded border border-[var(--border)]">
              J/K keys
            </span>
            <button
              type="button"
              onClick={() => {
                setSplitMode(!splitMode);
                userInteractedRef.current = true;
                markUserInteracted();
              }}
              className="text-xs bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {splitMode ? "Single View" : "Compare A/B"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLightbox(true);
                userInteractedRef.current = true;
                markUserInteracted();
              }}
              className="text-xs bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--link-aa)] border border-[var(--border)] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1"
            >
              <span>Lightbox</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInspector(!showInspector);
                userInteractedRef.current = true;
                markUserInteracted();
              }}
              className={`text-xs border font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs ${
                showInspector
                  ? "bg-[var(--text)] text-[var(--surface)] border-[var(--text)]"
                  : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--bg)]"
              }`}
            >
              {showInspector ? "Hide Spec" : "Inspect Spec"}
            </button>
          </div>
        </div>

        {/* Prompt Card */}
        <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 text-xs text-[var(--text)] leading-relaxed">
          {currentTake.prompt ? (
            <div>
              <p className={showFullPrompt ? "" : "line-clamp-2"}>
                {currentTake.prompt}
              </p>
              {currentTake.prompt.length > 90 && (
                <button
                  type="button"
                  onClick={() => setShowFullPrompt(!showFullPrompt)}
                  className="mt-1 text-[11px] underline text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  {showFullPrompt ? "Show less" : "Show all"}
                </button>
              )}
            </div>
          ) : (
            <span className="text-[var(--muted)] italic">
              Prompt not shared by creator
            </span>
          )}
        </div>

        {/* What changed line */}
        <div className="text-sm text-[var(--ink)] flex items-center justify-between">
          <div>
            <span className="text-[var(--muted)] font-medium">What changed: </span>
            <span>{currentTake.whatChanged}</span>
          </div>
          <span className="text-[10px] font-mono text-[var(--muted)] uppercase">
            Ratio {piece.aspectRatio}
          </span>
        </div>

        {/* Node Pipeline & Generation Parameters Spec Inspector */}
        {showInspector && (
          <div className="mt-2 p-3 bg-[var(--panel)] border-2 border-[var(--ink)]/20 flex flex-col gap-2 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-1.5">
              <span className="font-bold text-[var(--ink)] uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0b7a43] rounded-full status inline-block" />
                Pipeline Generation Spec (Take #{currentTake.n})
              </span>
              <span className="text-[10px] text-[#0b7a43] font-bold">VERIFIED REPRODUCIBLE</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
              <div className="p-1.5 bg-[var(--paper)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--muted)] block">Engine / Tool:</span>
                <span className="font-bold text-[var(--ink)]">{currentTake.tool}</span>
              </div>
              <div className="p-1.5 bg-[var(--paper)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--muted)] block">Aspect Ratio:</span>
                <span className="font-bold text-[var(--ink)]">{piece.aspectRatio}</span>
              </div>
              <div className="p-1.5 bg-[var(--paper)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--muted)] block">Iteration Step:</span>
                <span className="font-bold text-[var(--ink)]">{currentTake.n} / {piece.takesCount}</span>
              </div>
              <div className="p-1.5 bg-[var(--paper)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--muted)] block">Clearance Status:</span>
                <span className="font-bold text-[#0b7a43]">COMMERCIALLY CLEARED</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Figma Lightbox Take Viewer */}
      <TakeViewerModal
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
        initialTake={currentTake.n}
        totalTakes={piece.takesCount}
      />
    </figure>
  );
}

