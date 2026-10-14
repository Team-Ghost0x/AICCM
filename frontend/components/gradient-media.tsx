"use client";

import React from "react";

export type GradientPreset =
  | "aura"
  | "magenta"
  | "amber"
  | "indigo"
  | "teal"
  | "sunset";

export interface GradientMediaProps {
  imageUrl?: string;
  preset?: GradientPreset;
  variant?:
    | "perfume-hero"
    | "magenta-deep"
    | "teal-flow"
    | "sunset-radiance"
    | "indigo-neon"
    | "amber-glow"
    | "aura-subtle"
    | string;
  aspectRatio?: "4:5" | "1:1" | "16:9" | "9:16" | string;
  showPerfumeBottle?: boolean;
  className?: string;
  takeNumber?: number;
  takeLabel?: string;
  showInteractiveShine?: boolean;
  showProgressSegments?: boolean;
  bottleTitle?: string;
}

export function GradientMedia({
  imageUrl,
  preset = "aura",
  variant,
  aspectRatio = "4:5",
  showPerfumeBottle,
  className = "",
  takeNumber,
  takeLabel,
  showInteractiveShine = false,
  showProgressSegments = true,
  bottleTitle = "Basalt",
}: GradientMediaProps) {
  // If variant is perfume-hero and no imageUrl specified, use photorealistic AI master
  let activeImageUrl = imageUrl;
  if (!activeImageUrl && variant === "perfume-hero") {
    activeImageUrl = "/media/hero/take-hero-master.jpg";
  }

  // Map variant to preset and perfume bottle visibility if provided
  let activePreset: GradientPreset = preset;
  let shouldShowBottle = showPerfumeBottle;

  if (variant) {
    if (variant === "perfume-hero") {
      activePreset = "aura";
      if (shouldShowBottle === undefined) shouldShowBottle = true;
    } else if (variant === "magenta-deep") {
      activePreset = "magenta";
      if (shouldShowBottle === undefined) shouldShowBottle = false;
    } else if (variant === "teal-flow") {
      activePreset = "teal";
      if (shouldShowBottle === undefined) shouldShowBottle = false;
    } else if (variant === "sunset-radiance") {
      activePreset = "sunset";
      if (shouldShowBottle === undefined) shouldShowBottle = false;
    } else if (variant === "indigo-neon") {
      activePreset = "indigo";
      if (shouldShowBottle === undefined) shouldShowBottle = false;
    } else if (variant === "amber-glow") {
      activePreset = "amber";
      if (shouldShowBottle === undefined) shouldShowBottle = false;
    } else if (variant === "aura-subtle") {
      activePreset = "aura";
      if (shouldShowBottle === undefined) shouldShowBottle = false;
    }
  }

  if (shouldShowBottle === undefined) {
    shouldShowBottle = activePreset === "aura";
  }

  // Handle aspect ratio
  let ratioClass = "aspect-[4/5]";
  if (aspectRatio === "4:5" || aspectRatio === "aspect-[4/5]") {
    ratioClass = "aspect-[4/5]";
  } else if (aspectRatio === "1:1" || aspectRatio === "aspect-square") {
    ratioClass = "aspect-square";
  } else if (aspectRatio === "16:9" || aspectRatio === "aspect-video") {
    ratioClass = "aspect-video";
  } else if (aspectRatio === "9:16" || aspectRatio === "aspect-[9/16]") {
    ratioClass = "aspect-[9/16]";
  } else if (aspectRatio.startsWith("aspect-")) {
    ratioClass = aspectRatio;
  }

  const gradientClasses: Record<GradientPreset, string> = {
    aura: "bg-aura-gradient",
    magenta: "bg-magenta-gradient",
    amber: "bg-amber-gradient",
    indigo: "bg-indigo-gradient",
    teal: "bg-teal-gradient",
    sunset: "bg-sunset-gradient",
  };

  const gradientClass = gradientClasses[activePreset] || "bg-aura-gradient";
  const displayLabel = takeLabel || (takeNumber !== undefined ? `Take ${takeNumber}` : undefined);

  // If we have an image URL, render photorealistic hero media with cinematic overlays
  if (activeImageUrl) {
    return (
      <div
        className={`relative w-full ${ratioClass} overflow-hidden rounded-2xl flex items-center justify-center select-none shadow-md group ${className}`}
      >
        <img
          src={activeImageUrl}
          alt={bottleTitle || "Cinematic piece preview"}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Cinematic contrast vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/30 pointer-events-none" />

        {/* Stories Progress Bars at Top */}
        {showProgressSegments && (
          <div className="absolute top-3 inset-x-4 z-20 flex items-center gap-1.5 pointer-events-none">
            <div className="flex-1 h-[2.5px] bg-white/40 rounded-full" />
            <div className="flex-1 h-[2.5px] bg-white/40 rounded-full" />
            <div className="flex-1 h-[3px] bg-white rounded-full shadow-xs" />
            <div className="flex-1 h-[2.5px] bg-white/40 rounded-full" />
            <div className="flex-1 h-[2.5px] bg-white/40 rounded-full" />
          </div>
        )}

        {/* Floating Take Badge */}
        {displayLabel && (
          <div className="absolute top-4 left-4 z-20 bg-black/70 backdrop-blur-md text-white text-[11px] font-mono font-bold px-3 py-1 rounded-full border border-white/20 shadow-md flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{displayLabel}</span>
          </div>
        )}

        {/* Floating Commercial Clearance Tag */}
        <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-[11px] font-mono">
          <span className="font-bold text-purple-400">{bottleTitle}</span>
          <span className="text-white/40">·</span>
          <span className="text-emerald-400">Commercially Cleared</span>
        </div>

        {/* Interactive Shine FX */}
        {showInteractiveShine && (
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -rotate-45 group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${ratioClass} ${gradientClass} overflow-hidden rounded-2xl flex items-center justify-center select-none shadow-sm group ${className}`}
    >
      {/* Subtle atmospheric vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/25 pointer-events-none" />

      {/* Stories Progress Bars at Top */}
      {showProgressSegments && shouldShowBottle && (
        <div className="absolute top-2.5 inset-x-3 z-20 flex items-center gap-1.5 pointer-events-none">
          <div className="flex-1 h-[2px] bg-white/40 rounded-full" />
          <div className="flex-1 h-[2px] bg-white/40 rounded-full" />
          <div className="flex-1 h-[2.5px] bg-white rounded-full shadow-xs" />
          <div className="flex-1 h-[2px] bg-white/40 rounded-full" />
          <div className="flex-1 h-[2px] bg-white/40 rounded-full" />
        </div>
      )}

      {/* Signature Frosted Glass Perfume Bottle from Figma Board */}
      {shouldShowBottle && (
        <div className="relative z-10 flex flex-col items-center justify-center transform transition-transform duration-500 group-hover:scale-105">
          {/* Bottle Atomizer Cap */}
          <div className="w-5 h-7 bg-white/90 rounded-t-sm shadow-md flex items-center justify-center border border-white/40">
            <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
          </div>

          {/* Bottle Collar */}
          <div className="w-8 h-2 bg-gradient-to-r from-neutral-200 via-white to-neutral-200 border-y border-white/60 shadow-sm" />

          {/* Bottle Body: Frosted Minimalist Silhouette */}
          <div className="relative w-28 h-52 bg-white/45 backdrop-blur-md rounded-xl border border-white/60 shadow-2xl flex flex-col items-center justify-between py-6 px-4 overflow-hidden">
            {/* Glass Highlights */}
            <div className="absolute top-0 left-2 w-1.5 h-full bg-white/40 rounded-full blur-[1px]" />
            <div className="absolute top-0 right-3 w-0.5 h-full bg-white/30 rounded-full" />

            {/* Subtle Brand Label */}
            <div className="text-center z-10 opacity-80">
              <span className="text-[10px] font-sans tracking-[0.25em] text-neutral-900 font-bold block uppercase">
                {bottleTitle}
              </span>
              <span className="text-[8px] font-mono tracking-widest text-neutral-800 uppercase block mt-0.5">
                Parfum · 100ml
              </span>
            </div>

            {/* Liquid Level Reflection */}
            <div className="w-full h-16 bg-white/20 rounded-md border border-white/20" />
          </div>

          {/* Soft Floor Reflection / Shadow */}
          <div className="w-24 h-3 bg-black/20 blur-md rounded-full mt-3" />
        </div>
      )}

      {/* Floating take badge if takeNumber or takeLabel provided */}
      {displayLabel && (
        <div className="absolute top-3 left-3 z-20 bg-black/60 backdrop-blur-md text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border border-white/20 shadow-sm">
          {displayLabel}
        </div>
      )}

      {/* Interactive Shine FX */}
      {showInteractiveShine && (
        <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -rotate-45 group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
      )}
    </div>
  );
}
