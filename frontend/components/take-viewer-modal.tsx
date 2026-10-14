"use client";

import React, { useState } from "react";
import { GradientMedia, GradientPreset } from "./gradient-media";
import { CloseIcon } from "./icons";
import { CommunicationModal } from "./communication-modal";
import { allPlatformCreators } from "@/lib/contract/fixtures";

interface TakeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorHandle?: string;
  creatorName?: string;
  initialTake?: number;
  totalTakes?: number;
}

export function TakeViewerModal({
  isOpen,
  onClose,
  creatorHandle = "mira.okonkwo",
  creatorName = "Mira Okonkwo",
  initialTake = 9,
  totalTakes = 23,
}: TakeViewerModalProps) {
  const [currentTake, setCurrentTake] = useState(initialTake);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const takePresets: Record<
    number,
    {
      preset: GradientPreset;
      showBottle: boolean;
      prompt: string;
      change: string;
      tool: string;
    }
  > = {
    1: {
      preset: "magenta",
      showBottle: false,
      prompt: "perfume bottle on dark beach, dramatic lighting, high key mist",
      change: "Initial rough generation. Lighting flat, bottle glass opaque.",
      tool: "Midjourney",
    },
    4: {
      preset: "teal",
      showBottle: false,
      prompt: "perfume bottle on wet dark sand, blue hour specular highlights",
      change: "Improved sand reflections and mist. Bottle silhouette refined.",
      tool: "Midjourney",
    },
    9: {
      preset: "aura",
      showBottle: true,
      prompt:
        "perfume bottle on wet black basalt, rim light, water droplets, shallow depth of field",
      change: "Rim light and droplets. The mood finally lands.",
      tool: "Midjourney",
    },
    17: {
      preset: "indigo",
      showBottle: true,
      prompt:
        "perfume bottle on wet black basalt, rim light, water droplets, sharp caustic refraction",
      change: "Refractions locked, color balance harmonized.",
      tool: "Midjourney + Magnific",
    },
    23: {
      preset: "sunset",
      showBottle: true,
      prompt:
        "perfume bottle on wet black basalt, iridescent rim light, condensation, commercial pass",
      change: "Final color grade and commercial upscaling pass completed.",
      tool: "Midjourney + Magnific",
    },
  };

  const keyTakes = [1, 4, 9, 17, 23];
  const activeInfo =
    takePresets[currentTake] || {
      preset: "aura" as GradientPreset,
      showBottle: true,
      prompt: `perfume bottle on wet black basalt, take ${currentTake} iteration pass`,
      change: `Iteration step ${currentTake}: lighting and caustic reflection adjustments.`,
      tool: "Midjourney",
    };

  const targetCreator =
    allPlatformCreators.find((c) => c.handle === creatorHandle) ||
    allPlatformCreators[1] ||
    allPlatformCreators[0];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/85 backdrop-blur-lg animate-fade-in">
        {/* Modal Window Container */}
        <div className="relative w-full max-w-5xl bg-zinc-950 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
          {/* Top Bar Header matching PDF Page 9 */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full p-[1.5px] ring-gradient-teal flex-shrink-0">
                <div className="w-full h-full rounded-full bg-cyan-500 text-white font-bold text-xs flex items-center justify-center">
                  M
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{creatorHandle}</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Basalt, a fragrance still. Sample
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsInviteOpen(true)}
                className="px-3.5 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Invite
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Take Viewer"
              >
                <CloseIcon size={16} />
              </button>
            </div>
          </div>

          {/* Main Body Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
            {/* Left / Center: Large Media Viewer Canvas (7 cols on lg) */}
            <div className="lg:col-span-7 p-6 flex flex-col items-center justify-center bg-black/40 border-b lg:border-b-0 lg:border-r border-white/10">
              <div className="w-full max-w-md shadow-2xl rounded-2xl overflow-hidden relative">
                {/* Stories Progress Bar across top of image */}
                <div className="absolute top-3 inset-x-4 z-20 flex items-center gap-1.5 pointer-events-none">
                  <div className="flex-1 h-[2px] bg-white/40 rounded-full" />
                  <div className="flex-1 h-[2px] bg-white/40 rounded-full" />
                  <div className="flex-1 h-[2.5px] bg-white rounded-full shadow-xs" />
                  <div className="flex-1 h-[2px] bg-white/40 rounded-full" />
                  <div className="flex-1 h-[2px] bg-white/40 rounded-full" />
                </div>

                <GradientMedia
                  preset={activeInfo.preset}
                  bottleTitle="Basalt"
                  showPerfumeBottle={activeInfo.showBottle}
                  aspectRatio="aspect-[4/5]"
                  takeLabel={`Take ${currentTake} of ${totalTakes}`}
                  showInteractiveShine
                  showProgressSegments={false}
                />
              </div>
            </div>

            {/* Right: Scrubber, Thumbnails (1 4 9 17 23), Prompt Telemetry, and Invite CTA (5 cols on lg) */}
            <div className="lg:col-span-5 p-6 flex flex-col justify-between gap-6 bg-zinc-950/80">
              <div className="flex flex-col gap-5">
                {/* Title & Tool row */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="text-lg font-black text-white">
                    Take {currentTake} of {totalTakes}
                  </h4>
                  <span className="text-xs font-mono text-zinc-400">
                    Midjourney
                  </span>
                </div>

                {/* Filmstrip Quick Pick Cards (1, 4, 9, 17, 23) matching PDF Page 9 */}
                <div className="flex items-center gap-2 justify-between">
                  {keyTakes.map((tk) => {
                    const tkData = takePresets[tk];
                    return (
                      <button
                        key={tk}
                        type="button"
                        onClick={() => setCurrentTake(tk)}
                        aria-label={`Take ${tk}`}
                        className={`flex-1 flex flex-col items-center p-1 rounded-xl transition-all cursor-pointer ${
                          currentTake === tk
                            ? "ring-2 ring-purple-500 bg-purple-500/20 scale-105"
                            : "opacity-60 hover:opacity-100 hover:bg-white/5"
                        }`}
                      >
                        <div className="w-full h-10 rounded-lg overflow-hidden mb-1 pointer-events-none">
                          <GradientMedia
                            preset={tkData.preset}
                            bottleTitle="Basalt"
                            showPerfumeBottle={tkData.showBottle}
                            showProgressSegments={false}
                            aspectRatio="aspect-video"
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-white">
                          {tk}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Scrubber Bar with purple thumb */}
                <div>
                  <input
                    type="range"
                    min="1"
                    max={totalTakes}
                    value={currentTake}
                    onChange={(e) => setCurrentTake(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#7c3aed]"
                  />
                </div>

                {/* Prompt Card matching PDF Page 9 */}
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 text-xs">
                  <p className="text-zinc-200 font-mono italic leading-relaxed mb-3">
                    &quot;{activeInfo.prompt}&quot;
                  </p>
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-white font-bold block text-xs">
                      What changed:{" "}
                      <span className="font-normal text-zinc-300">
                        {activeInfo.change}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Badges & Creator Statement matching PDF Page 9 */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-medium rounded-full">
                      Cleared for commercial use
                    </span>
                    <span className="px-2.5 py-1 bg-white/10 text-zinc-300 text-[11px] font-medium rounded-full">
                      Midjourney
                    </span>
                    <span className="px-2.5 py-1 bg-white/10 text-zinc-300 text-[11px] font-medium rounded-full">
                      Magnific
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 font-mono leading-relaxed mt-1">
                    Creator states: paid plans, commercial use allowed under the plan terms at the time.
                  </p>
                </div>
              </div>

              {/* Bottom CTA: Purple Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(true)}
                  className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.01] active:scale-98 transition-all cursor-pointer text-center"
                >
                  Invite Mira to a brief
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Creator Communication Modal */}
      {isInviteOpen && (
        <CommunicationModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          targetCreator={targetCreator}
        />
      )}
    </>
  );
}
