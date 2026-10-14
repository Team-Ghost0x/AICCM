"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MediaFrame } from "@/components/media-frame";
import { TakeScrubber } from "@/components/take-scrubber";
import { CheckIcon, PlusIcon, CloseIcon, UserIcon } from "@/components/icons";
import { PortfolioPiece } from "@/lib/contract/schemas";
import { getCurrentUser, User, onAuthChange } from "@/lib/client/auth";
import { AuthModal } from "@/components/auth-modal";

type Stage = "invited" | "proposal" | "in_production" | "review" | "delivered";

interface TrackerTake {
  n: number;
  note: string;
  tool: string;
  prompt: string;
  mediaUrl: string;
  status: "submitted" | "approved" | "changes_requested";
  feedback?: string;
}

const STAGES: { id: Stage; label: string; description: string }[] = [
  { id: "invited", label: "Invited", description: "Brief invitation dispatched to creator" },
  { id: "proposal", label: "Proposal", description: "Creative approach & milestone sign-off" },
  { id: "in_production", label: "In Production", description: "Generative passes, prompts & upscaling" },
  { id: "review", label: "Review", description: "Iterative review of generation takes" },
  { id: "delivered", label: "Delivered", description: "Master deliverables & commercial license handed over" },
];

const DEFAULT_TAKES: TrackerTake[] = [
  {
    n: 9,
    note: "Locked cybernetic character facial telemetry, reflective wet chrome textures, and cyan ocular glow.",
    tool: "Runway Gen-3 Alpha & ComfyUI",
    prompt: "Cinematic close-up portrait of female cyborg android, wet carbon fiber and polished chrome faceplates, glowing cyan optical eyes, raindrops on metallic cheek, neon rim light, 8k movie still.",
    mediaUrl: "/media/hero/take-3.jpg",
    status: "approved",
  },
  {
    n: 17,
    note: "Integrated floating holographic UI telemetry layers and color-graded the anamorphic blues.",
    tool: "ComfyUI & Flux Schnell",
    prompt: "Futuristic filmmaker holographic timeline editor and neural VFX workstation, quantum waveform visuals, floating optical telemetry panels, cinematic anamorphic bokeh, 8k ultra-sharp detail.",
    mediaUrl: "/media/hero/take-4.jpg",
    status: "submitted",
  },
  {
    n: 24,
    note: "Master 8K IMAX color grade with volumetric searchlights and commercial clearance.",
    tool: "Topaz Video AI & Magnific",
    prompt: "Master cinematic 8k movie still of female cybernetic operative on high-rise balcony looking across vast sprawling cyberpunk metropolis, torrential neon rain, flying spinners, anamorphic lens flare.",
    mediaUrl: "/media/hero/take-5.jpg",
    status: "submitted",
  },
];

const STORAGE_KEY = "retake_tracker_state_v2";

export default function TrackerPage() {
  const [currentStage, setCurrentStage] = useState<Stage>(() => {
    if (typeof window === "undefined") return "review";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.currentStage) return parsed.currentStage;
      }
    } catch {
      // Fallback cleanly
    }
    return "review";
  });

  const [takes, setTakes] = useState<TrackerTake[]>(() => {
    if (typeof window === "undefined") return DEFAULT_TAKES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.takes) && parsed.takes.length > 0) return parsed.takes;
      }
    } catch {
      // Fallback cleanly
    }
    return DEFAULT_TAKES;
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTakeNumber, setNewTakeNumber] = useState<number>(() => {
    if (typeof window === "undefined") return 31;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.takes) && parsed.takes.length > 0) {
          const maxN = Math.max(...parsed.takes.map((t: TrackerTake) => t.n || 0));
          return maxN + 7;
        }
      }
    } catch {
      // Fallback cleanly
    }
    return 31;
  });
  const [newTakeNote, setNewTakeNote] = useState("");
  const [newTakeTool, setNewTakeTool] = useState("Runway Gen-3");
  const [newTakePrompt, setNewTakePrompt] = useState("");
  const [newTakeMediaUrl, setNewTakeMediaUrl] = useState("/media/hero/take-1.jpg");
  const [editingFeedbackIndex, setEditingFeedbackIndex] = useState<number | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u));
    return () => unsub();
  }, []);

  // Save state updates
  const persistState = (newStage: Stage, newTakes: TrackerTake[]) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ currentStage: newStage, takes: newTakes })
      );
    } catch {
      // Ignore storage errors in restricted contexts
    }
  };

  const handleStageSelect = (stage: Stage) => {
    setCurrentStage(stage);
    persistState(stage, takes);
    setStatusNotice(`Stage switched to ${stage.toUpperCase()}`);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleStatusChange = (takeNumber: number, newStatus: TrackerTake["status"]) => {
    const updated = takes.map((t) =>
      t.n === takeNumber ? { ...t, status: newStatus } : t
    );
    setTakes(updated);
    persistState(currentStage, updated);
    setStatusNotice(`Take ${takeNumber} marked as ${newStatus.replace("_", " ")}`);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleSaveFeedback = (takeNumber: number) => {
    const updated = takes.map((t) =>
      t.n === takeNumber ? { ...t, feedback: feedbackDraft.trim() } : t
    );
    setTakes(updated);
    persistState(currentStage, updated);
    setEditingFeedbackIndex(null);
    setFeedbackDraft("");
    setStatusNotice(`Revision note saved for Take ${takeNumber}`);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleAddTake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTakeNote.trim()) return;

    const createdTake: TrackerTake = {
      n: Number(newTakeNumber) || takes.length + 1,
      note: newTakeNote.trim(),
      tool: newTakeTool,
      prompt: newTakePrompt.trim() || "Generative iteration pass.",
      mediaUrl: newTakeMediaUrl,
      status: "submitted",
    };

    const updated = [...takes, createdTake];
    setTakes(updated);
    persistState(currentStage, updated);
    setShowAddModal(false);
    setNewTakeNote("");
    setNewTakePrompt("");
    setNewTakeNumber(createdTake.n + 7);
    setStatusNotice(`Take ${createdTake.n} added to review stream`);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleResetDemo = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setCurrentStage("review");
    setTakes(DEFAULT_TAKES);
    setNewTakeNumber(31);
    setStatusNotice("Demo reset to default pipeline state");
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const currentStageIndex = STAGES.findIndex((s) => s.id === currentStage);

  // Dynamic PortfolioPiece for interactive TakeScrubber
  const reviewPiece: PortfolioPiece = {
    id: "tracker-review-piece",
    title: "NEO-SHINJUKU 2099 (Teaser Review Reel)",
    description: "Live generation passes submitted by Mira Okonkwo.",
    contentType: "video",
    aspectRatio: "9:16",
    mediaUrl: takes[takes.length - 1]?.mediaUrl || "/media/hero/take-5.jpg",
    posterUrl: takes[0]?.mediaUrl || "/media/hero/take-1.jpg",
    toolsUsed: ["Runway Gen-3", "ComfyUI", "Topaz Video AI"],
    takesCount: takes.length,
    keyTakes: takes.map((t) => ({
      n: t.n,
      imageUrl: t.mediaUrl,
      tool: t.tool,
      prompt: t.prompt,
      whatChanged: t.note,
    })),
    workflow: [
      { order: 1, tool: "Runway Gen-3", what: "Base motion generation" },
      { order: 2, tool: "ComfyUI", what: "Fluid mist pass" },
      { order: 3, tool: "Topaz Video AI", what: "4K upscale" },
    ],
    rights: "commercial_cleared",
    rightsBasis: "Commercial worldwide license released on approval",
    isSample: false,
  };

  if (!user) {
    return (
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center select-none flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--link-aa)] shadow-sm">
          <UserIcon size={32} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
          Sign In to Access Project Workspace
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary-aa)] max-w-md">
          The production tracker and milestone delivery pipeline are protected workspaces restricted to authenticated Brands, Creative Agencies, and assigned Creators.
        </p>
        <button
          type="button"
          onClick={() => setShowAuthModal(true)}
          className="mt-2 px-6 py-3 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
        >
          Sign In / Create Account
        </button>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 text-left flex flex-col gap-8">
      {/* Status Notice Toast */}
      {statusNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-3 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-[var(--border)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary-aa)] font-bold">
              Production Workspace // Milestone Delivery Tracker
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 px-2 py-0.5 rounded-full">
              Active Engagement
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text)] tracking-tight">
            Project Workspace &amp; Delivery
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary-aa)] mt-1">
            Campaign: <strong className="text-[var(--text)]">NEO-SHINJUKU 2099 Cyberpunk Teaser</strong> · Creator: <strong className="text-[var(--text)]">Mira Okonkwo</strong> (@mira-motion)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === "brand" && (
            <Link
              href="/discover"
              className="text-xs bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] font-semibold px-3.5 py-2 rounded-xl transition-colors"
            >
              Find more creators
            </Link>
          )}
          <button
            type="button"
            onClick={handleResetDemo}
            className="text-xs text-[var(--text-secondary-aa)] hover:text-[var(--text)] underline cursor-pointer"
          >
            Reset demo pipeline
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Stages Stepper (4 cols) */}
        <div className="lg:col-span-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col gap-4">
          <div className="border-b border-[var(--border)] pb-3">
            <h2 className="text-base font-bold text-[var(--text)]">
              Engagement Milestones
            </h2>
            <span className="text-[11px] text-[var(--text-secondary-aa)]">
              Track progress, inspect takes, and manage revision approvals
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {STAGES.map((s, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = s.id === currentStage;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleStageSelect(s.id)}
                  className={`flex items-start gap-3 p-3 text-left transition-all cursor-pointer rounded-xl border ${
                    isCurrent
                      ? "bg-[var(--text)] text-[var(--surface)] border-[var(--text)] shadow-xs"
                      : isPast
                      ? "bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:border-[var(--control-border)]"
                      : "bg-transparent text-[var(--text-secondary-aa)] border-transparent hover:bg-[var(--bg)] hover:text-[var(--text)]"
                  }`}
                >
                  <span
                    className={`w-6 h-6 flex items-center justify-center font-mono text-xs font-bold rounded-lg shrink-0 ${
                      isCurrent
                        ? "bg-[var(--link-aa)] text-white"
                        : isPast
                        ? "bg-emerald-600 text-white"
                        : "bg-[var(--border)] text-[var(--text-secondary-aa)]"
                    }`}
                  >
                    {isPast ? <CheckIcon size={14} strokeWidth={2.5} /> : `0${idx + 1}`}
                  </span>
                  <div>
                    <span className="block text-xs font-bold">{s.label}</span>
                    <span
                      className={`text-[11px] block mt-0.5 leading-tight ${
                        isCurrent ? "text-white/80" : "text-[var(--text-secondary-aa)]"
                      }`}
                    >
                      {s.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current Milestone Quick Actions */}
          <div className="mt-2 pt-4 border-t border-[var(--border)] flex flex-col gap-2 text-xs">
            <span className="font-bold text-[var(--text)] uppercase tracking-wider text-[10px]">
              Milestone Navigation
            </span>
            <div className="flex gap-2">
              {currentStageIndex > 0 && (
                <button
                  type="button"
                  onClick={() => handleStageSelect(STAGES[currentStageIndex - 1].id)}
                  className="flex-1 bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] py-2 rounded-lg font-semibold cursor-pointer"
                >
                  Previous stage
                </button>
              )}
              {currentStageIndex < STAGES.length - 1 && (
                <button
                  type="button"
                  onClick={() => handleStageSelect(STAGES[currentStageIndex + 1].id)}
                  className="flex-1 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white py-2 rounded-lg font-bold cursor-pointer transition-colors"
                >
                  Advance stage
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Stage Panel (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Stage 1: Invited */}
          {currentStage === "invited" && (
            <div className="bg-[var(--surface)] p-6 md:p-8 border border-[var(--border)] rounded-2xl shadow-xs flex flex-col gap-6">
              <div className="border-b border-[var(--border)] pb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary-aa)] block font-semibold">
                  Stage 01 // Dispatched
                </span>
                <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight mt-1">
                  Invitation Dispatched to Mira Okonkwo
                </h2>
                <p className="text-xs text-[var(--text-secondary-aa)] mt-1">
                  Brief: NEO-SHINJUKU 2099 Cyberpunk Teaser · Response expected within 18 hours
                </p>
              </div>

              <div className="bg-[var(--bg)] p-5 border border-[var(--border)] rounded-xl flex flex-col gap-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[var(--text)]">Creator Status</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Online · Reviewing Brief
                  </span>
                </div>
                <p className="text-[var(--text-secondary-aa)] leading-relaxed">
                  Mira Okonkwo has been notified and sent a personalized invitation for the campaign. Commercial terms, deliverables count, and draft timeline have been delivered to her dashboard.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleStageSelect("proposal")}
                  className="bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                >
                  Accept Approach &amp; Open Proposal
                </button>
              </div>
            </div>
          )}

          {/* Stage 2: Proposal */}
          {currentStage === "proposal" && (
            <div className="bg-[var(--surface)] p-6 md:p-8 border border-[var(--border)] rounded-2xl shadow-xs flex flex-col gap-6">
              <div className="border-b border-[var(--border)] pb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary-aa)] block font-semibold">
                  Stage 02 // Sign-off
                </span>
                <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight mt-1">
                  Creative Approach &amp; Commercial Terms
                </h2>
                <p className="text-xs text-[var(--text-secondary-aa)] mt-1">
                  Milestones agreed for NEO-SHINJUKU 2099 Cyberpunk Teaser
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[var(--bg)] p-4 border border-[var(--border)] rounded-xl">
                  <span className="font-mono uppercase text-[var(--text-secondary-aa)] block mb-1 text-[10px]">Deliverables</span>
                  <strong className="text-sm text-[var(--text)] block">3x 9:16 Vertical Video Takes</strong>
                  <span className="text-[var(--text-secondary-aa)] block mt-1">Including 4K upscale masters and clean plates</span>
                </div>
                <div className="bg-[var(--bg)] p-4 border border-[var(--border)] rounded-xl">
                  <span className="font-mono uppercase text-[var(--text-secondary-aa)] block mb-1 text-[10px]">Agreed Budget</span>
                  <strong className="text-sm text-[var(--text)] block">₹95,000 INR</strong>
                  <span className="text-[var(--text-secondary-aa)] block mt-1">Held securely in platform escrow</span>
                </div>
              </div>

              <div className="bg-[var(--bg)] p-4 border border-[var(--border)] rounded-xl text-xs">
                <span className="font-bold text-[var(--text)] block mb-1">Commercial Clearance Terms</span>
                <p className="text-[var(--text-secondary-aa)]">
                  Paid Advertising &amp; Organic Social, Worldwide, 1 Year duration. Tool stack verified with Midjourney &amp; Runway commercial licenses.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleStageSelect("in_production")}
                  className="bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                >
                  Sign-off Milestone 1 &amp; Begin Production
                </button>
              </div>
            </div>
          )}

          {/* Stage 3: In Production */}
          {currentStage === "in_production" && (
            <div className="bg-[var(--surface)] p-6 md:p-8 border border-[var(--border)] rounded-2xl shadow-xs flex flex-col gap-6">
              <div className="border-b border-[var(--border)] pb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary-aa)] block font-semibold">
                  Stage 03 // Active Pipeline
                </span>
                <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight mt-1">
                  Generative Passes in Progress
                </h2>
                <p className="text-xs text-[var(--text-secondary-aa)] mt-1">
                  Mira is executing generation passes through ComfyUI and Runway Gen-3
                </p>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                <div className="bg-[var(--bg)] p-4 border border-[var(--border)] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                      <CheckIcon size={16} strokeWidth={2.5} />
                    </span>
                    <div>
                      <strong className="text-[var(--text)] block">01 / Concept prompt exploration</strong>
                      <span className="text-[var(--text-secondary-aa)]">Explored 28 seed variations for cyberpunk neo-Tokyo aesthetic</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">Complete</span>
                </div>

                <div className="bg-[var(--bg)] p-4 border border-[var(--border)] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                      <CheckIcon size={16} strokeWidth={2.5} />
                    </span>
                    <div>
                      <strong className="text-[var(--text)] block">02 / Temporal coherence pass</strong>
                      <span className="text-[var(--text-secondary-aa)]">Runway Gen-3 camera rotation with locked cybernetic character geometry</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">Complete</span>
                </div>

                <div className="bg-[var(--bg)] p-4 border border-[var(--border)] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block animate-pulse" />
                    <div>
                      <strong className="text-[var(--text)] block">03 / Generation takes rendered</strong>
                      <span className="text-[var(--text-secondary-aa)]">Takes 9, 17, and 24 ready for review scrubbing</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--link-aa)] font-bold">Ready</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleStageSelect("review")}
                  className="bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                >
                  Open Take Review Scrubber
                </button>
              </div>
            </div>
          )}

          {/* Stage 4: Review Takes (Full Interactive Experience) */}
          {currentStage === "review" && (
            <div className="flex flex-col gap-8">
              {/* Interactive Take Scrubber Module */}
              <div className="bg-[var(--surface)] p-6 md:p-8 border border-[var(--border)] rounded-2xl shadow-sm flex flex-col gap-6">
                <div className="border-b border-[var(--border)] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary-aa)] block">
                      Stage 04 // Interactive Take Scrubber
                    </span>
                    <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight mt-1">
                      Scrub &amp; Compare Generation Passes
                    </h2>
                    <p className="text-xs text-[var(--text-secondary-aa)] mt-1">
                      Use slider, J / K shortcuts, or click comparison points to inspect changes
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="bg-[var(--text)] hover:opacity-90 text-[var(--bg)] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer self-start sm:self-auto transition-all"
                  >
                    <PlusIcon size={14} />
                    <span>Submit new take</span>
                  </button>
                </div>

                {/* Scrubber component */}
                <TakeScrubber piece={reviewPiece} />
              </div>

              {/* Review Takes Stream */}
              <div className="bg-[var(--surface)] p-6 md:p-8 border border-[var(--border)] rounded-2xl shadow-sm flex flex-col gap-6">
                <div className="border-b border-[var(--border)] pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text)]">
                      Active Review Stream
                    </h3>
                    <span className="text-xs text-[var(--text-secondary-aa)]">
                      {takes.length} takes under review · Review notes persist automatically
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[var(--text)]">
                    {takes.filter((t) => t.status === "approved").length}/{takes.length} Approved
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {takes.map((take, idx) => (
                    <div
                      key={take.n}
                      className="bg-[var(--surface)] p-5 border border-[var(--border)] rounded-xl hover:border-[var(--text)] transition-all flex flex-col sm:flex-row gap-5 items-start"
                    >
                      <div className="w-32 h-32 flex-shrink-0 bg-[var(--surface-sunken)] rounded-lg overflow-hidden border border-[var(--border)]">
                        <MediaFrame
                          src={take.mediaUrl}
                          ratio="1:1"
                          alt={`Take ${take.n}`}
                          takeNumber={take.n}
                          className="w-full h-full"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between h-full gap-3 text-xs w-full">
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base text-[var(--text)]">
                                Take {take.n}
                              </span>
                              <span className="text-[11px] font-mono text-[var(--text-secondary-aa)] bg-[var(--surface-sunken)] border border-[var(--border)] px-2 py-0.5 rounded-md">
                                {take.tool}
                              </span>
                            </div>

                            <span
                              className={`text-[11px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-md border ${
                                take.status === "approved"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : take.status === "changes_requested"
                                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                                  : "bg-[var(--surface-sunken)] text-[var(--text-secondary-aa)] border-[var(--border)]"
                              }`}
                            >
                              {take.status.replace("_", " ")}
                            </span>
                          </div>

                          <p className="text-[var(--text)] font-medium mt-2 leading-relaxed">
                            {take.note}
                          </p>

                          {take.prompt && (
                            <p className="text-[var(--text-secondary-aa)] text-[11px] font-mono mt-1 leading-snug line-clamp-2">
                              Prompt: &ldquo;{take.prompt}&rdquo;
                            </p>
                          )}

                          {/* Existing Feedback */}
                          {take.feedback && (
                            <div className="mt-2.5 p-3 bg-red-500/5 border-l-2 border-red-500 rounded-r-lg text-[11px] text-[var(--text)]">
                              <strong className="text-red-600 dark:text-red-400">Brand Revision Note:</strong> {take.feedback}
                            </div>
                          )}
                        </div>

                        {/* Inline Feedback Editor */}
                        {editingFeedbackIndex === idx ? (
                          <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                            <label className="text-[11px] font-bold text-[var(--text)]">
                              Add revision note for Take {take.n}:
                            </label>
                            <input
                              type="text"
                              value={feedbackDraft}
                              onChange={(e) => setFeedbackDraft(e.target.value)}
                              placeholder="e.g. Reduce glare on neon reflection by 20%"
                              className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveFeedback(take.n)}
                                className="bg-[var(--text)] text-[var(--bg)] px-3 py-1 rounded-lg text-xs font-bold hover:opacity-90 transition-all"
                              >
                                Save note
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingFeedbackIndex(null)}
                                className="text-xs text-[var(--text-secondary-aa)] hover:text-[var(--text)] underline"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(take.n, "approved")}
                                className="bg-[var(--text)] hover:opacity-90 text-[var(--bg)] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Approve take
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(take.n, "changes_requested")}
                                className="bg-[var(--surface)] hover:bg-[var(--surface-sunken)] text-[var(--text)] border border-[var(--border)] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Request changes
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingFeedbackIndex(idx);
                                setFeedbackDraft(take.feedback || "");
                              }}
                              className="text-xs text-[var(--text-secondary-aa)] hover:text-[var(--text)] underline"
                            >
                              {take.feedback ? "Edit note" : "+ Add revision note"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Final Handover Trigger */}
                <div className="border-t border-[var(--border)] pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-[var(--text-secondary-aa)]">
                    Ready to complete this milestone? Approving final deliverables transfers commercial rights.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStageSelect("delivered")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    Accept Deliverables &amp; Issue Commercial License
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stage 5: Delivered */}
          {currentStage === "delivered" && (
            <div className="bg-[var(--surface)] p-6 md:p-8 border border-[var(--border)] rounded-2xl shadow-sm flex flex-col gap-6">
              <div className="border-b border-[var(--border)] pb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold block">
                  Stage 05 // Completed &amp; Released
                </span>
                <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight mt-1">
                  Deliverables Handed Over &amp; License Issued
                </h2>
                <p className="text-xs text-[var(--text-secondary-aa)] mt-1">
                  Campaign: NEO-SHINJUKU 2099 Cyberpunk Teaser · Commercial license verified
                </p>
              </div>

              {/* License Certificate Stamped */}
              <div className="bg-[var(--surface)] p-6 border-2 border-emerald-500/40 rounded-xl flex flex-col gap-4 text-xs">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckIcon size={20} strokeWidth={2.5} />
                    </span>
                    <strong className="text-sm text-[var(--text)]">
                      COMMERCIAL CLEARANCE CERTIFICATE #RTK-2026-994
                    </strong>
                  </div>
                  <span className="font-mono text-[11px] text-[var(--text-secondary-aa)]">
                    Date: 13 Oct 2026
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="font-mono uppercase text-[var(--text-secondary-aa)] block">Licensee</span>
                    <strong className="text-[var(--text)]">Acme Footwear Ltd</strong>
                  </div>
                  <div>
                    <span className="font-mono uppercase text-[var(--text-secondary-aa)] block">Creator</span>
                    <strong className="text-[var(--text)]">Mira Okonkwo (@mira-motion)</strong>
                  </div>
                  <div>
                    <span className="font-mono uppercase text-[var(--text-secondary-aa)] block">Territory &amp; Term</span>
                    <strong className="text-[var(--text)]">Worldwide · 1 Year</strong>
                  </div>
                </div>

                <div className="p-3 bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg text-[11px] text-[var(--text)] leading-relaxed">
                  Clearance Basis: All model weights, LoRA embeddings, and audio generation tools utilized in this production are commercially licensed with evidence logs filed on the Retake ledger.
                </div>
              </div>

              {/* Asset Download Stream */}
              <div className="flex flex-col gap-2.5 text-xs">
                <span className="font-bold text-[var(--text)] uppercase tracking-wider text-[11px]">
                  Master Package Downloads:
                </span>
                <div className="bg-[var(--surface)] p-4 border border-[var(--border)] rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-[var(--text)] block">Monsoon_Take09_Master_4K.mov</strong>
                    <span className="text-[var(--text-secondary-aa)] text-[11px]">ProRes 422 HQ · 3840x2160 · 2.4 GB</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusNotice("Download started: Monsoon_Take09_Master_4K.mov");
                      setTimeout(() => setStatusNotice(null), 3000);
                    }}
                    className="bg-[var(--text)] hover:opacity-90 text-[var(--bg)] px-4 py-2 rounded-lg font-bold transition-all"
                  >
                    Download
                  </button>
                </div>

                <div className="bg-[var(--surface)] p-4 border border-[var(--border)] rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-[var(--text)] block">Monsoon_Vertical_Reel_1080x1920.mp4</strong>
                    <span className="text-[var(--text-secondary-aa)] text-[11px]">H.264 Master · 9:16 Vertical · 185 MB</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusNotice("Download started: Monsoon_Vertical_Reel.mp4");
                      setTimeout(() => setStatusNotice(null), 3000);
                    }}
                    className="bg-[var(--text)] hover:opacity-90 text-[var(--bg)] px-4 py-2 rounded-lg font-bold transition-all"
                  >
                    Download
                  </button>
                </div>

                <div className="bg-[var(--surface)] p-4 border border-[var(--border)] rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-[var(--text)] block">Prompt_Stems_and_ComfyUI_Graph.json</strong>
                    <span className="text-[var(--text-secondary-aa)] text-[11px]">Workflow seeds, LoRA hyperparameters · 14 KB</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusNotice("Download started: Workflow_Graph.json");
                      setTimeout(() => setStatusNotice(null), 3000);
                    }}
                    className="bg-[var(--text)] hover:opacity-90 text-[var(--bg)] px-4 py-2 rounded-lg font-bold transition-all"
                  >
                    Download
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => handleStageSelect("review")}
                  className="text-xs text-[var(--text-secondary-aa)] hover:text-[var(--text)] underline"
                >
                  Return to review takes
                </button>
                <Link
                  href="/briefs/new"
                  className="bg-[var(--link-aa)] hover:opacity-90 text-[var(--bg)] font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-sm"
                >
                  Post a new campaign brief
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Submit New Take */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-5 text-left text-xs">
            <div className="border-b border-[var(--border)] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[var(--text)]">
                  Submit New Generation Take
                </h3>
                <span className="text-xs text-[var(--text-secondary-aa)]">
                  Append a new creative pass to this review stream
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[var(--text-secondary-aa)] hover:text-[var(--text)] p-1 cursor-pointer rounded-lg hover:bg-[var(--surface-sunken)]"
                aria-label="Close dialog"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleAddTake} className="flex flex-col gap-4">
              <div>
                <label className="font-bold text-[var(--text)] block mb-1">
                  Take Number
                </label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={newTakeNumber}
                  onChange={(e) => setNewTakeNumber(Number(e.target.value))}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[var(--text)] block mb-1">
                  Tool Used
                </label>
                <select
                  value={newTakeTool}
                  onChange={(e) => setNewTakeTool(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
                >
                  <option value="Runway Gen-3">Runway Gen-3</option>
                  <option value="ComfyUI + Flux Schnell">ComfyUI + Flux Schnell</option>
                  <option value="Midjourney v6.1">Midjourney v6.1</option>
                  <option value="Kling 1.5">Kling 1.5</option>
                  <option value="Topaz Video AI">Topaz Video AI</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[var(--text)] block mb-1">
                  What Changed (Diff Summary)
                </label>
                <input
                  type="text"
                  value={newTakeNote}
                  onChange={(e) => setNewTakeNote(e.target.value)}
                  placeholder="e.g. Amplified wet ground reflections, softened key light"
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[var(--text)] block mb-1">
                  Prompt Snippet
                </label>
                <textarea
                  rows={2}
                  value={newTakePrompt}
                  onChange={(e) => setNewTakePrompt(e.target.value)}
                  placeholder="e.g. Dynamic camera tilt, anamorphic water droplets..."
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
                />
              </div>

              <div>
                <label className="font-bold text-[var(--text)] block mb-1">
                  Preview Frame Asset
                </label>
                <select
                  value={newTakeMediaUrl}
                  onChange={(e) => setNewTakeMediaUrl(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
                >
                  <option value="/media/hero/take-1.jpg">Take Frame 1 (Neo-Tokyo Metropolis)</option>
                  <option value="/media/hero/take-2.jpg">Take Frame 2 (Neural Wireframe Character)</option>
                  <option value="/media/hero/take-3.jpg">Take Frame 3 (Cyborg Rain Portrait)</option>
                  <option value="/media/hero/take-4.jpg">Take Frame 4 (Holographic Quantum HUD)</option>
                  <option value="/media/hero/take-5.jpg">Take Frame 5 (Final 8K Master Shot)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--text)] font-bold text-xs hover:bg-[var(--surface-sunken)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[var(--text)] hover:opacity-90 text-[var(--bg)] font-bold text-xs px-5 py-2 rounded-lg transition-all"
                >
                  Submit take
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
