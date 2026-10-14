"use client";

import React, { useState } from "react";
import { AspectRatio } from "@/lib/contract/schemas";

interface MediaFrameProps {
  src: string;
  ratio: AspectRatio;
  alt: string;
  takeNumber?: number;
  className?: string;
  priority?: boolean;
  showHud?: boolean;
}

const RATIO_CLASSES: Record<AspectRatio, string> = {
  "9:16": "aspect-[9/16]",
  "1:1": "aspect-[1/1]",
  "4:5": "aspect-[4/5]",
  "16:9": "aspect-[16/9]",
  "21:9": "aspect-[21/9]",
};

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

export function MediaFrame({
  src,
  ratio,
  alt,
  takeNumber,
  className = "",
  showHud = false,
}: MediaFrameProps) {
  const [hasError, setHasError] = useState(false);
  const ratioClass = RATIO_CLASSES[ratio] || "aspect-[4/5]";
  const safeSrc = isSafeMediaUrl(src) ? src : "";

  return (
    <div
      className={`relative w-full ${ratioClass} bg-[#000000] overflow-hidden rounded-xl select-none ${className}`}
    >
      {!hasError && safeSrc ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={safeSrc}
            alt={alt}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover take-crossfade rounded-xl block"
          />

          {/* Camera Viewfinder Telemetry HUD */}
          {showHud && (
            <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between font-mono text-[10px] text-[#ffffff] bg-[#000000]/15">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-[#000000]/70 px-2 py-0.5 rounded-[2px]">
                  <span className="w-2 h-2 rounded-full tally bg-[#e8341c] animate-tally-blink inline-block" />
                  <span className="font-bold tracking-wider">REC</span>
                  <span className="text-[#b9b9b9]">00:04:12:08</span>
                </div>
                <div className="bg-[#000000]/70 px-2 py-0.5 rounded-[2px] text-[#b9b9b9]">
                  {ratio} · 24.00 FPS
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="bg-[#000000]/70 px-2 py-0.5 rounded-[2px] text-[#b9b9b9]">
                  ISO 800 · 180° SHUTTER
                </div>
                <div className="bg-[#000000]/70 px-2 py-0.5 rounded-[2px] text-[#0b7a43] font-bold">
                  4K MASTER PRORES
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#161616] text-[#b9b9b9] border border-[#3d3d3d]">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full tally bg-[#e8341c] animate-tally-blink inline-block" />
            <span className="text-xs tracking-wider uppercase font-mono font-bold text-[#ffffff]">
              {takeNumber ? `Take ${takeNumber} Frame` : "Production Reel"}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#b9b9b9]">
            {ratio} Aspect · Render Master Active
          </span>
        </div>
      )}
    </div>
  );
}
