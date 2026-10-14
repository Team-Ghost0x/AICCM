"use client";

import React, { useState } from "react";
import Link from "next/link";
import { goldenCreators, indianCreators } from "@/lib/contract/fixtures";
import { TakeScrubber } from "@/components/take-scrubber";
import { NodePipelineGraph } from "@/components/node-pipeline-graph";
import { RightsMatrix } from "@/components/rights-matrix";
import { CommercialUse, PortfolioPiece } from "@/lib/contract/schemas";
import {
  playClickSound,
  playTakeTick,
  playDirectionalTick,
  playSuccessChime,
  playThemeSound,
} from "@/lib/client/audio";

const DEFAULT_COMMERCIAL_USE: CommercialUse = {
  uses: ["paid_social", "website", "organic_social"],
  territory: "global",
  termMonths: 12,
  exclusivity: "category",
  rightsTransfer: "license",
  aiDisclosure: "creator_discretion",
  noModelTraining: true,
};

type StudioTab = "scrubber" | "pipeline" | "rights" | "audio";

export default function DirectorStudioPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>("scrubber");
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("creator-mira");
  const [commercialUse, setCommercialUse] = useState<CommercialUse>(DEFAULT_COMMERCIAL_USE);
  const [engineModel, setEngineModel] = useState<string>("Flux.1 Schnell (fp8)");
  const [cfgScale, setCfgScale] = useState<number>(7.5);
  const [steps, setSteps] = useState<number>(28);
  const [seed, setSeed] = useState<number>(4289104);
  const [customPrompt, setCustomPrompt] = useState<string>(
    "cinematic anamorphic 35mm shot of futuristic cyberpunk android, rim lighting, neon reflection, rain droplets, volumetric fog --ar 4:5 --v 6.1"
  );
  const [generationFeedback, setGenerationFeedback] = useState<string | null>(null);

  const creators = [...goldenCreators, ...indianCreators];
  const activeCreator =
    creators.find((c) => c.id === selectedCreatorId) || goldenCreators[0];
  const activePiece: PortfolioPiece =
    activeCreator.portfolio[0] || goldenCreators[0].portfolio[0];

  const handleSimulateGeneration = () => {
    playSuccessChime();
    setSeed(Math.floor(Math.random() * 9000000) + 1000000);
    setGenerationFeedback("Synthesized new take branch with updated seed & CFG guidance!");
    setTimeout(() => setGenerationFeedback(null), 3000);
  };

  return (
    <div className="w-full min-h-screen py-8 md:py-12 flex flex-col gap-8 select-none">
      {/* Studio Banner & Telemetry Header */}
      <section className="max-w-[1360px] mx-auto px-6 md:px-12 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-[var(--border-color)] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[var(--panel)] px-2.5 py-1 border border-[var(--border-color)] w-fit mb-3">
              <span className="w-2 h-2 rounded-full tally bg-[#e8341c] animate-tally-blink inline-block" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--ink)] font-bold">
                DIRECTOR SCREENING SUITE // TAKE LAB v2.6
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[var(--ink)] tracking-tight leading-none">
              Director Studio
            </h1>
            <p className="text-sm md:text-base text-[var(--muted)] mt-2 max-w-2xl">
              Inspect generative prompt evolution, scrub intermediate model takes, analyze ComfyUI node graphs, and clear commercial licensing rights.
            </p>
          </div>

          {/* Quick Stats / Telemetry Capsule */}
          <div className="flex items-center gap-3">
            <div className="bg-[var(--panel)] border border-[var(--border-color)] p-3 text-right font-mono">
              <span className="text-[10px] text-[var(--muted)] uppercase block">Active Reel</span>
              <span className="text-sm font-bold text-[var(--ink)]">{activePiece.title}</span>
            </div>
            <div className="bg-[var(--panel)] border border-[var(--border-color)] p-3 text-right font-mono">
              <span className="text-[10px] text-[#0b7a43] uppercase block">Clearance</span>
              <span className="text-sm font-bold text-[#0b7a43]">LEGAL 100%</span>
            </div>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 border-b border-[var(--border-color)] mt-6 overflow-x-auto pb-1">
          {[
            { id: "scrubber", label: "Take Scrubber & Reel" },
            { id: "pipeline", label: "Node Pipeline Graph" },
            { id: "rights", label: "Rights Clearance Matrix" },
            { id: "audio", label: "Sensory Audio Lab" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playClickSound();
                setActiveTab(tab.id as StudioTab);
              }}
              className={`px-3 py-2 text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#e8341c] text-[var(--ink)] bg-[var(--panel)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--border-color)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Main Studio Viewport */}
      <section className="max-w-[1360px] mx-auto px-6 md:px-12 w-full">
        {/* TAB 1: Take Scrubber & Live Reel */}
        {activeTab === "scrubber" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 cols: Scrubber Display */}
            <div className="lg:col-span-7 bg-[var(--panel)] border-2 border-[var(--border-color)] p-4 sm:p-6">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full tally bg-[#e8341c] animate-tally-blink inline-block" />
                  <span className="text-xs font-mono font-bold text-[var(--ink)] uppercase">
                    Interactive Cinema Scrubber
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--muted)]">
                  {activePiece.takesCount} Takes in Reel
                </span>
              </div>

              <TakeScrubber piece={activePiece} />
            </div>

            {/* Right 5 cols: Director Console & Parameter Tuner */}
            <div className="lg:col-span-5 flex flex-col gap-6 text-left">
              {/* Creator & Reel Selector */}
              <div className="bg-[var(--panel)] border border-[var(--border-color)] p-4 sm:p-5 flex flex-col gap-3">
                <label className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-bold">
                  Select Director Reel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {creators.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setSelectedCreatorId(c.id);
                      }}
                      className={`text-left p-2.5 border text-xs font-mono transition-all cursor-pointer ${
                        selectedCreatorId === c.id
                          ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-bold"
                          : "bg-[var(--paper)] text-[var(--ink)] border-[var(--border-color)] hover:bg-[var(--panel-elevated)]"
                      }`}
                    >
                      <span className="block font-bold truncate">{c.displayName}</span>
                      <span className="text-[10px] opacity-75 truncate block">{c.location}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generative Synthesis Sandbox */}
              <div className="bg-[var(--panel)] border border-[var(--border-color)] p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                  <span className="text-xs font-mono uppercase font-bold text-[var(--ink)]">
                    Model Inference Parameters
                  </span>
                  <span className="text-[10px] font-mono text-[#0b7a43] font-bold">LIVE SYNC</span>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[var(--muted)] block mb-1">
                    Checkpoint Engine:
                  </label>
                  <select
                    value={engineModel}
                    onChange={(e) => {
                      playClickSound();
                      setEngineModel(e.target.value);
                    }}
                    className="w-full bg-[var(--paper)] text-[var(--ink)] border border-[var(--border-color)] text-xs font-mono p-2 rounded-[2px]"
                  >
                    <option value="Flux.1 Schnell (fp8)">Flux.1 Schnell (fp8) - Black Forest Labs</option>
                    <option value="Runway Gen-3 Alpha">Runway Gen-3 Alpha - Neural Video</option>
                    <option value="Kling 1.5 HD">Kling 1.5 HD - Camera Spatial Engine</option>
                    <option value="Midjourney v6.1">Midjourney v6.1 - Cinematic Photorealism</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-[var(--muted)] block mb-1">
                      Guidance CFG: {cfgScale}
                    </label>
                    <input
                      type="range"
                      min="1.0"
                      max="15.0"
                      step="0.5"
                      value={cfgScale}
                      onChange={(e) => setCfgScale(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--muted)] block mb-1">
                      Inference Steps: {steps}
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="60"
                      step="2"
                      value={steps}
                      onChange={(e) => setSteps(parseInt(e.target.value, 10))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[var(--muted)] block mb-1">
                    Directorial Prompt:
                  </label>
                  <textarea
                    rows={3}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full bg-[var(--paper)] text-[var(--ink)] border border-[var(--border-color)] text-xs font-mono p-2 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-[var(--muted)]">Seed: #{seed}</span>
                  <button
                    type="button"
                    onClick={handleSimulateGeneration}
                    className="bg-[#e8341c] hover:bg-[#d02c16] text-[#ffffff] font-mono text-xs font-bold px-4 py-2 rounded-[2px] transition-transform active:scale-95 cursor-pointer"
                  >
                    Generate Next Take
                  </button>
                </div>

                {generationFeedback && (
                  <div className="p-2 bg-[var(--paper)] border border-[#0b7a43] text-[#0b7a43] font-mono text-xs text-center animate-pulse">
                    {generationFeedback}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Node Pipeline Graph */}
        {activeTab === "pipeline" && (
          <div className="bg-[var(--panel)] border-2 border-[var(--border-color)] p-6">
            <div className="mb-4">
              <h2 className="text-xl font-black text-[var(--ink)]">
                ComfyUI &amp; Neural Pipeline Topology
              </h2>
              <p className="text-xs text-[var(--muted)] font-mono mt-1">
                Verifiable node dependency graph for {activeCreator.displayName} — {activePiece.title}
              </p>
            </div>
            <NodePipelineGraph
              creatorName={activeCreator.displayName}
              pieceTitle={activePiece.title}
            />
          </div>
        )}

        {/* TAB 3: Rights Clearance Matrix */}
        {activeTab === "rights" && (
          <div className="flex flex-col gap-6">
            <div className="bg-[var(--panel)] border-2 border-[var(--border-color)] p-6">
              <div className="mb-4">
                <h2 className="text-xl font-black text-[var(--ink)]">
                  Commercial Rights &amp; Legal Clearance Matrix
                </h2>
                <p className="text-xs text-[var(--muted)] font-mono mt-1">
                  Configure usage scope, territory, term duration, and issue cryptographically verifiable certificates.
                </p>
              </div>
              <RightsMatrix value={commercialUse} onChange={setCommercialUse} />
            </div>
          </div>
        )}

        {/* TAB 4: Sensory Audio Lab */}
        {activeTab === "audio" && (
          <div className="bg-[var(--panel)] border-2 border-[var(--border-color)] p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-black text-[var(--ink)]">
                Web Audio Sensory Feedback Synthesizer
              </h2>
              <p className="text-xs text-[var(--muted)] font-mono mt-1">
                Zero-asset synthesized mechanical clicks, pitch-modulated scrub ticks, and legal harmonic chimes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[var(--paper)] border border-[var(--border-color)] flex flex-col justify-between gap-3">
                <div>
                  <span className="font-mono text-xs font-bold text-[var(--ink)] block">
                    Forward Scrub Tick
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    Elevated pitch (1.35x) indicating forward iteration step
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => playDirectionalTick("forward")}
                  className="bg-[var(--ink)] text-[var(--paper)] py-2 text-xs font-mono font-bold cursor-pointer hover:bg-[var(--muted)] transition-colors"
                >
                  ▶ Play Forward Tick
                </button>
              </div>

              <div className="p-4 bg-[var(--paper)] border border-[var(--border-color)] flex flex-col justify-between gap-3">
                <div>
                  <span className="font-mono text-xs font-bold text-[var(--ink)] block">
                    Backward Rewind Tick
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    Lower pitch (0.75x) indicating take rewind step
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => playDirectionalTick("backward")}
                  className="bg-[var(--ink)] text-[var(--paper)] py-2 text-xs font-mono font-bold cursor-pointer hover:bg-[var(--muted)] transition-colors"
                >
                  ◀ Play Rewind Tick
                </button>
              </div>

              <div className="p-4 bg-[var(--paper)] border border-[var(--border-color)] flex flex-col justify-between gap-3">
                <div>
                  <span className="font-mono text-xs font-bold text-[var(--ink)] block">
                    Legal Clearance Chime
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    Tri-tone harmonic sine chime (C5-E5-G5) on certificate issuance
                  </span>
                </div>
                <button
                  type="button"
                  onClick={playSuccessChime}
                  className="bg-[#0b7a43] text-[#ffffff] py-2 text-xs font-mono font-bold cursor-pointer hover:bg-[#096637] transition-colors"
                >
                  Play Clearance Chime
                </button>
              </div>

              <div className="p-4 bg-[var(--paper)] border border-[var(--border-color)] flex flex-col justify-between gap-3">
                <div>
                  <span className="font-mono text-xs font-bold text-[var(--ink)] block">
                    Mechanical Click
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    Tactile mechanical micro-transient on toggle and role buttons
                  </span>
                </div>
                <button
                  type="button"
                  onClick={playClickSound}
                  className="bg-[var(--ink)] text-[var(--paper)] py-2 text-xs font-mono font-bold cursor-pointer hover:bg-[var(--muted)] transition-colors"
                >
                  ● Play Click
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
